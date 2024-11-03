import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket';
import { fetchTeamData, createConversation, loadMessages, backend_ws_url } from './api';
import { User } from 'lucide-react';

export const ConversationUI = ({ team_id }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [recipient, setRecipient] = useState('');
    const [agents, setAgents] = useState([]);
    const [teamData, setTeamData] = useState(null);
    const [error, setError] = useState(null);
    const [conversationStarted, setConversationStarted] = useState(false);
    const [wsConnection, setWsConnection] = useState(null);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const getTeamData = async () => {
            if (!team_id) return;

            try {
                const data = await fetchTeamData(team_id);
                setTeamData(data.data);
                setAgents(data.data.map((i) => i.name));
            } catch (err) {
                console.error(err.message);
                setError(err.message);
            }
        };

        getTeamData();
    }, [team_id]);

    useEffect(() => {
        const loadInitialMessages = async () => {
            if (!team_id) return;

            try {
                const loadedMessages = await loadMessages(team_id);
                console.log(loadedMessages)
                setMessages(loadedMessages.messages);
            } catch (err) {
                console.error("Failed to load messages:", err);
                setError("Failed to load messages");
            }
        };

        loadInitialMessages();
        const intervalId = setInterval(loadInitialMessages, 2000); // Poll every 5 seconds

        return () => clearInterval(intervalId);
    }, [team_id]);

    const { sendMessage, lastMessage, readyState } = useWebSocket(

        `${backend_ws_url}/c2/${team_id}`,
        {
            onOpen: () => console.log('WebSocket Connected'),
            shouldReconnect: (closeEvent) => true,
            retryOnError: true,
            reconnectAttempts: 10,
            reconnectInterval: 3000,
        },
        conversationStarted // Only connect when conversation has started
    );

    useEffect(() => {
        if (lastMessage !== null) {
            const data = JSON.parse(lastMessage.data);
            if (data.request_id) {
                // Handle response from send_and_wait_for_response
                console.log("Received response for request:", data.request_id);
                // You can add additional handling here if needed
            } else {
                // Regular message from backend
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        }
    }, [lastMessage]);

    // useEffect(() => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [messages]);

    useEffect(() => {
        if (conversationStarted) {
            setWsConnection({ sendMessage, lastMessage, readyState });
        }
    }, [conversationStarted, sendMessage, lastMessage, readyState]);

    const initializeConversation = async () => {
        try {
            await createConversation(team_id, { name: team_id }, teamData);
            setConversationStarted(true);
        } catch (error) {
            console.error("Failed to initialize conversation:", error);
            setError("Failed to initialize conversation");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!conversationStarted) {
            await initializeConversation();
        } else if (inputMessage.trim() !== '' && recipient && wsConnection) {
            const messageData = {
                message: inputMessage,
                conversation_id: team_id,
                recipient: recipient,
                sender: 'Human',
                content: [{ type: 'text', text: inputMessage }]
            };
            wsConnection.sendMessage(JSON.stringify(messageData));
            setMessages((prevMessages) => [...prevMessages, messageData]);
            setInputMessage('');
        }
    };

    const MessageContent = ({ content }) => {
        if (Array.isArray(content)) {
            return content.map((item, index) => {
                if (typeof item === 'string') {
                    return <p key={index}>{item}</p>;
                } else if (item.type === 'text') {
                    return <p key={index}>{item.text}</p>;
                }
                return null;
            });
        }
        return null;
    };

    const Message = ({ msg, index }) => {
        const isHuman = msg.sender === 'Human';
        const alignmentClass = isHuman ? 'text-right' : 'text-left';
        const bgColorClass = isHuman ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100';
        const paddingClass = isHuman ? 'sm:pl-24' : 'sm:pr-24';

        return (
            <div key={index} className={`mb-4 ${alignmentClass} ${paddingClass}`}>
                <div className={`inline-block p-2 rounded-lg ${bgColorClass} whitespace-pre-wrap max-w-full sm:max-w-[75%]`}>
                    <p className="font-bold">{msg.sender || msg.name}</p>
                    {msg.type === 'introspection' && <p className="italic">Introspection</p>}
                    {msg.type === 'introspection_tool_use' && <p className="italic">Tool Use Introspection</p>}
                    <MessageContent content={msg.content} />
                </div>
            </div>
        );
    };

    const MessageList = ({ messages, messagesEndRef }) => {
        return (
            <div className="flex-grow overflow-y-auto p-5 pt-10">
                {messages?.map((msg, index) => (
                    <Message key={index} msg={msg} index={index} />
                ))}
                <div ref={messagesEndRef} />
            </div>
        );
    };

    const AgentList = () => {
        return (
            <div className="w-full h-auto sm:w-[250px] sm:h-full overflow-y-auto p-4 bg-gray-800 text-white">
                <h2 className="text-xl font-bold mb-4">Agents</h2>
                <div className="space-y-4">
                    {teamData?.map((agent, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-3 shadow-md hover:bg-gray-600 transition-colors">
                            <div className="flex items-center mb-2">
                                <User className="w-6 h-6 mr-2 text-blue-400" />
                                <h3 className="text-lg text-gray-100 font-semibold">{agent.name}</h3>
                            </div>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{agent.prompt}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col sm:flex-row w-screen h-[95vh] bg-gray-900 text-gray-100">
            <div className="flex flex-col flex-grow order-2 sm:order-1">
                <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
                    <div className="flex-grow overflow-y-auto p-4">
                        <MessageList messages={messages} messagesEndRef={messagesEndRef} />
                    </div>
                </div>
                <form onSubmit={handleSendMessage} className="p-4 bg-gray-800">
                    <div className="flex flex-col sm:flex-row mb-2">
                        <select
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="mb-2 sm:mb-0 sm:mr-2 p-2 border rounded bg-gray-700 text-gray-100 border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select an agent</option>
                            {agents.map((agent) => (
                                <option key={agent} value={agent}>
                                    {agent}
                                </option>
                            ))}
                        </select>
                        <div className="flex flex-grow">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                className="flex-grow p-2 border rounded-l bg-gray-700 text-gray-100 border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Type your message..."
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={conversationStarted && !recipient}
                            >
                                {conversationStarted ? 'Send' : 'Initialize Conversation'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <div className="order-1 sm:order-2">
                <AgentList />
            </div>
        </div>
    );
};