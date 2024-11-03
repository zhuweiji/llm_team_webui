import json
import logging
import os
from enum import Enum
from glob import glob
from pathlib import Path
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from agent_dashboard.backend.utils import generate_short_id
from fastapi import APIRouter, BackgroundTasks, HTTPException
from src.agents import team_creation
from src.agents.utils.team_creator_utils import retry
from pydantic import BaseModel

log = logging.getLogger(__name__)

router = APIRouter()

team_data_dir = Path(
    r'D:\projects\testbed\open-llm-swe\agent_dashboard\backend\data\teams')


class CreateTeamRequest(BaseModel):
    task: str


class TaskStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Task(BaseModel):
    id: str
    status: TaskStatus
    result: Optional[Dict] = None


tasks: Dict[UUID, Task] = {}


async def create_team_task(task_id: UUID, task: str):
    try:
        tasks[task_id].status = TaskStatus.PROCESSING
        team_id = await _create_team_task(task)
        tasks[task_id].status = TaskStatus.COMPLETED
        tasks[task_id].result = {
            "team_id": team_id,
            "message": "Team created successfully"
        }

    except Exception as e:
        tasks[task_id].status = TaskStatus.FAILED
        tasks[task_id].result = {"error": str(e)}


async def _create_team_task(task: str):
    # await asyncio.sleep(10)
    create_team_with_retry = retry(team_creation.create_team,
                                   max_attempts=3,
                                   delay=1)

    agents, workflow = create_team_with_retry(task)
    team_id = str(generate_short_id())

    team_data_dir.mkdir(parents=True, exist_ok=True)

    agents_file = team_data_dir / f'{team_id}_agents.json'
    agents_file.write_text(
        json.dumps([agent.to_dict() for agent in agents.values()]))

    workflow_file = team_data_dir / f'{team_id}_workflow.json'
    workflow_file.write_text(workflow)

    return team_id


@router.get("/tasks/{task_id}")
async def get_task_status_endpoint(task_id: UUID):
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "task_id": task.id,
        "status": task.status.value,
        "result": task.result
    }


@router.get("/teams")
async def get_teams_endpoint():
    matching_files = team_data_dir.glob("*_agents.json")
    # Search for the specific team file
    matching_files = [f.name.strip('_agents.json') for f in matching_files]

    return {'data': matching_files}


@router.get("/teams/{team_id}")
async def get_team_endpoint(team_id: str):
    pattern = os.path.join(team_data_dir, "*_agents.json")
    matching_files = glob(pattern)
    # Search for the specific team file
    target_filename = f"{team_id}_agents.json"
    matching_file = next(
        (f for f in matching_files if os.path.basename(f) == target_filename),
        None)

    if matching_file:
        # Read and return the JSON content
        with open(matching_file, 'r') as file:
            data = json.load(file)
            return {'data': data}
    else:
        raise HTTPException(status_code=404, detail="Team id not found")


@router.post("/teams/create")
async def create_team_endpoint(request: CreateTeamRequest,
                               background_tasks: BackgroundTasks):
    """Connect to an existing conversation"""
    task_id = uuid4()
    tasks[task_id] = Task(id=str(task_id), status=TaskStatus.PENDING)

    background_tasks.add_task(create_team_task, task_id, request.task)

    return {"task_id": task_id, "status": "pending"}


def load_team_conversation_messages(conversation_id: str) -> List[Dict]:
    """currently team_conversation is an alias for a conversation history that includes introspection data. The /get_conversation_message_routes should be decommisoned."""
    c_dir = Path(
        fr'D:\projects\testbed\open-llm-swe\agent_dashboard\backend\data\teams\{conversation_id}\conversations'
    )
    c_dir.mkdir(exist_ok=True, parents=True)

    filename = c_dir / f"{conversation_id}_messages.json"
    if os.path.exists(filename):
        with open(filename, "r") as f:
            return json.load(f)
    return []


def save_team_conversation_messages(conversation_id: str, message: dict):
    c_dir = Path(
        fr'D:\projects\testbed\open-llm-swe\agent_dashboard\backend\data\teams\{conversation_id}\conversations'
    )
    c_dir.mkdir(exist_ok=True, parents=True)

    messages = load_team_conversation_messages(conversation_id)
    messages.append(message)

    # overwrite file and write anew
    filename = c_dir / f"{conversation_id}_messages.json"
    log.info(f'adding new message to {filename}')
    with open(filename, "w") as f:
        json.dump(messages, f)


@router.post("/teams/{team_id}/messages/store")
async def save_team_conversation_message(team_id: str, message: dict):
    save_team_conversation_messages(conversation_id=team_id, message=message)
    return {"status": "success", "message": "Message stored successfully"}


@router.get("/teams/{team_id}/messages/load")
async def load_team_conversation_message(team_id: str):
    messages = load_team_conversation_messages(conversation_id=team_id)
    return {"messages": messages}
