import asyncio
import json
import logging
import os
import random
from dataclasses import dataclass
from enum import Enum
from glob import glob
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from agent_dashboard.sdk import AgentTraceSDK, load_team_conversation_messages
from fastapi import (
    APIRouter,
    BackgroundTasks,
    FastAPI,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    WebSocketException,
)
from fastapi.responses import JSONResponse
from src.agents.tools.base_tool import get_all_exported_tools, get_tool_by_name
from src.conversations import ConversationMessage, ConversationWithAgents, LLMAgent
from src.conversations.participants import HumanParticipant, Participant
from pydantic import BaseModel

log = logging.getLogger(__name__)
router = APIRouter()


@dataclass
class NewMessageForHuman:
    conversation_message: ConversationMessage

    def to_dict(self):
        return {
            "class_name": self.__class__.__name__,
            "conversation_message": self.conversation_message.to_dict(),
        }


class HumanResponse(BaseModel):
    participant_name: str
    message: str

    class Config:
        extra = "ignore"  # This will ignore any extra fields during deserialization


@dataclass
class RecipientNotFound:
    message: str = ""

    def to_dict(self):
        return {"class_name": self.__class__.__name__, "message": self.message}


# routes handle connection management - sending/receiving data with


@router.websocket("/c2/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    """Connect to an existing conversation"""

    log.info(conversation_id)
    log.info(WebSocketConversationManager.active_conversations)

    if conversation_id not in WebSocketConversationManager.active_conversations:
        await websocket.close(code=404)
        return
    await WebSocketConversationManager.connect(websocket, conversation_id)

    try:
        while True:
            data = await websocket.receive_json()
            await WebSocketConversationManager.handle_incoming_data(data)
    except WebSocketDisconnect:
        WebSocketConversationManager.disconnect(conversation_id)


class CreateNewAgentRequest(BaseModel):
    name: str
    prompt: str = ""
    tools: List[str]
    agent_type: Optional[str] = "LLMAgent"


class CreateConversationRequest(BaseModel):
    name: str
    conversation_id: Optional[str] = None
    agent_tool_use_enabled: bool = True
    human_intervention_count: int = 4


@router.post("/c2/create")
async def create_conversation(
    create_conversation_request: CreateConversationRequest,
    create_new_agent_requests: List[CreateNewAgentRequest],
):
    """Create a conversation"""

    conversation_id = []
    if conversation_id := create_conversation_request.conversation_id:
        messages = load_team_conversation_messages(
            create_conversation_request.conversation_id)
    conversation_id = WebSocketConversationManager.create_new_conversation(
        create_conversation_request=create_conversation_request,
        create_agent_requests=create_new_agent_requests,
        conversation_history=messages,
    )
    return JSONResponse(content={"conversation_id": conversation_id},
                        status_code=201)


class WebSocketConversation(ConversationWithAgents):

    def __init__(
        self,
        name: str,
        conversation_id: str,
        human_intervention_count: int = 10,
        agent_tool_use_enabled: bool = True,
        message_history: Optional[List[ConversationMessage]] = None,
    ):

        super().__init__(
            name=name,
            human_intervention_count=human_intervention_count,
            agent_tool_use_enabled=agent_tool_use_enabled,
            conversation_id=conversation_id,
            message_history=message_history,
        )

    async def _handle_new_message_for_human(
        self,
        incoming_message: ConversationMessage,
    ):
        super()._handle_new_message_for_human(incoming_message)

        message = NewMessageForHuman(incoming_message)
        response = await WebSocketConversationManager.send_and_wait_for_response(
            conversation_id=self.conversation_id, message=message.to_dict())
        model = HumanResponse(**response)
        participant = self.get_participant_from_name(model.participant_name)
        if not participant:
            response_to_participant_not_found = (
                await WebSocketConversationManager.send_and_wait_for_response(
                    conversation_id=self.conversation_id,
                    message=RecipientNotFound().to_dict(),
                ))
            return
        self.prepare_new_message(
            ConversationMessage(sender=HumanParticipant(),
                                recipient=participant,
                                content=model.message))

    def is_started(self):
        return bool(self.message_history)

    def continue_conversation(self):
        # if not self.unprocessed_message:

        raise NotImplementedError()

    def create_workspace(self):
        workspace_dir = Path(
            rf"D:\projects\testbed\open-llm-swe\agent_dashboard\backend\data\teams\{self.conversation_id}\workspaces"
        )
        workspace = workspace_dir / self.conversation_id
        workspace.mkdir(parents=True, exist_ok=True)

        return workspace

    def start_as_human(self, first_message: str, recipient: Participant):
        workspace = self.create_workspace()

        first_message += f"Use the folder {workspace} as root when creating any files if no path is given."
        self.prepare_new_message(
            ConversationMessage(sender=HumanParticipant(),
                                recipient=recipient,
                                content=first_message))
        self._run_conversation()

    def _start(self, first_message: ConversationMessage):
        self.prepare_new_message(first_message)
        self._run_conversation()

    def _run_conversation(self):
        while self.unprocessed_message:
            if self.manual_interrupt_flag:
                self.manual_interrupt_flag = True
                self.manual_interrupt_flag = False
            self.advance()

    async def handle_new_conversation_message(self, message: str,
                                              recipient: str):
        human = next(p for p in self.participants
                     if isinstance(p, HumanParticipant))
        recipient_agent = next(
            p for p in self.participants
            if isinstance(p, LLMAgent) and p.name == recipient)

        self.prepare_new_message(
            ConversationMessage(sender=human,
                                recipient=recipient_agent,
                                content=message))

        while self.unprocessed_message:
            self.advance()

    # def advance(self):
    #     message = self.unprocessed_message

    #     if message:
    #         if self.tracer:
    #             self.tracer.store_team_message(message.to_dict())

    #     return super().advance()

    # def _agent_introspect(self,
    #                       previous_thoughts: List[str],
    #                       incoming_message: ConversationMessage,
    #                       ):
    #     new_thought, recipient = super()._agent_introspect(previous_thoughts=previous_thoughts,
    #                                                        incoming_message=incoming_message)

    #     if self.tracer:
    #         self.tracer.store_team_message({
    #             "type": "introspection",
    #             "content": [new_thought],
    #         })

    #     return new_thought, recipient


class WebSocketConversationManager:
    # WebSocketConversationManager handles conversation lifecycles - creating/destroying/pushing new messages from the network to the right conversation
    # also overloaded with the methods to send data

    active_conversations: Dict[str, WebSocketConversation] = {}
    active_connections: Dict[str, WebSocket] = {}
    pending_requests: Dict[str, asyncio.Future] = {}

    @classmethod
    async def connect(cls, websocket: WebSocket, conversation_id: str):
        await websocket.accept()

        cls.active_connections[conversation_id] = websocket

    @classmethod
    def disconnect(cls, conversation_id: str):
        cls.active_connections.pop(conversation_id, None)

    @classmethod
    def create_new_conversation(
        cls,
        create_conversation_request: "CreateConversationRequest",
        create_agent_requests: List["CreateNewAgentRequest"],
        conversation_history: Optional[List[dict]] = None,
    ):
        # Generate a unique conversation ID (you may want to use a more robust method)

        conversation_id = create_conversation_request.conversation_id or str(
            uuid4())

        agents = []
        for create_agent_request in create_agent_requests:
            # only implemented creating LLMAgents for now

            agent_type = create_agent_request.agent_type or "LLMAgent"
            agent = LLMAgent(name=create_agent_request.name,
                             prompt=create_agent_request.prompt)

            for tool_name in create_agent_request.tools:
                if tool := get_tool_by_name(tool_name):
                    agent.register_tool(tool)
            agents.append(agent)
        conversation = WebSocketConversation(
            name=create_conversation_request.name,
            conversation_id=conversation_id,
            human_intervention_count=create_conversation_request.
            human_intervention_count,
            agent_tool_use_enabled=create_conversation_request.
            agent_tool_use_enabled,
            message_history=conversation_history,
        )

        conversation.add_participants(agents)

        cls.active_conversations[conversation_id] = conversation

        return conversation_id

    @classmethod
    async def send_message(cls, conversation_id: str, message: dict):
        if conversation_id in cls.active_connections:
            await cls.active_connections[conversation_id].send_json(message)

    @classmethod
    async def send_and_wait_for_response(cls,
                                         conversation_id: str,
                                         message: dict,
                                         timeout: int = 30) -> dict:
        if conversation_id not in cls.active_connections:
            raise ValueError(
                f"No active connection for conversation_id: {conversation_id}")
        request_id = str(uuid4())
        message["request_id"] = request_id

        # Create a future to wait for the response

        response_future = asyncio.get_running_loop().create_future()
        cls.pending_requests[request_id] = response_future

        try:
            # Send the message

            await cls.send_message(conversation_id, message)

            # Wait for the response with a timeout

            response = await asyncio.wait_for(response_future, timeout)
            return response
        except asyncio.TimeoutError:
            raise TimeoutError(
                f"Timeout waiting for response to request {request_id}")
        finally:
            # Clean up the pending request

            cls.pending_requests.pop(request_id, None)

    @classmethod
    async def handle_incoming_data(cls, data: dict):
        # if no conversation id, generate some random thing so that user's cant tap into a malformed  conversations by setting as None

        conversation_id: str = data.get("conversation_id", str(uuid4()))
        message: str = data.get("message", "")
        recipient_name: str = data.get("recipient", "")

        if conversation_id not in cls.active_conversations:
            log.exception(
                f"got invalid conversation id from websocket data {data}")
        if not message:
            raise WebSocketException(code=422,
                                     reason="message cannot be empty")
        conversation = cls.active_conversations[conversation_id]

        if not conversation.is_started():
            log.info(f"received initial data: {data}")
            recipient = conversation.get_participant_from_name(recipient_name)
            if not recipient:
                raise WebSocketException(
                    code=422, reason=f"could not find recipient {recipient}")
            conversation.start_as_human(first_message=message,
                                        recipient=recipient)
        else:
            log.info(
                f"received data after conversation has been started: {data}")
