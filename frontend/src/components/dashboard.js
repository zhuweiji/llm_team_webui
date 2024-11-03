'use client'
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { fetchAgentMessages, fetchAgents, fetchConversationHistory, fetchConversations } from './api';
import { ConversationUI } from './conversation'

const AgentMessageItem = ({ message }) => {
    const totalTokens = message.usage ? message.usage.input_tokens + message.usage.output_tokens : null;

    const renderContent = (contentItem, index) => {
        if (contentItem.type === 'text') {
            return (
                <p key={index} className="mb-2 whitespace-pre-wrap">
                    {contentItem.text}
                </p>
            );
        } else if (contentItem.type === 'tool_use') {
            return (
                <div key={index} className="mb-2 p-2 bg-gray-900 rounded">
                    <p className="font-semibold">Tool: {contentItem.name}</p>
                    <p className="text-sm">Input:</p>
                    <pre className="text-xs bg-gray-800 p-1 rounded whitespace-pre-wrap">
                        {JSON.stringify(contentItem.input, null, 2)}
                    </pre>
                    {contentItem.output && (
                        <>
                            <p className="text-sm mt-2">Output:</p>
                            <pre className="text-xs bg-gray-800 p-1 rounded whitespace-pre-wrap">
                                {JSON.stringify(contentItem.output, null, 2)}
                            </pre>
                        </>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="border rounded-lg p-4 mb-4 bg-stone-950">
            <div className="flex justify-between items-center mb-2">
                <p className="font-bold capitalize">{message.role || message.sender}</p>
                {message.model && (
                    <span className="text-sm text-black-500">
                        Model: {message.model}
                    </span>
                )}
            </div>
            {Array.isArray(message.content) ? (
                message.content.map((contentItem, index) => renderContent(contentItem, index))
            ) : (
                <p className="mb-2 whitespace-pre-wrap">{message.content || message.message}</p>
            )}
            {totalTokens && (
                <div className="mt-2 text-sm text-black-600">
                    <p>Total Tokens: {totalTokens}</p>
                    <p>Stop Reason: {message.stop_reason}</p>
                </div>
            )}
        </div>
    );
};



const AgentMessages = ({ agentId }) => {
    const { data, isLoading, error } = useQuery(['agentMessages', agentId], () => fetchAgentMessages(agentId));

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Messages for {agentId}</h2>
            {data.messages.reverse().map((message, index) => (
                <AgentMessageItem key={index} message={message} />
            ))}
        </div>
    );
};

const ConversationMessages = ({ conversationName }) => {
    const { data, isLoading, error } = useQuery(['conversationHistory', conversationName], () => fetchConversationHistory(conversationName));

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Conversation: {conversationName}</h2>
            {
                data && data?.messages?.length > 0 ?

                    data.messages.reverse().map((message, index) => (
                        <AgentMessageItem key={index} message={message} />
                    )) :
                    <p>No messages in conversation available.</p>

            }
        </div>
    );
};

const Navbar = ({ view, setView }) => {
    return (
        <nav className="bg-blue-500 p-4 mb-8">
            <ul className="flex space-x-4">
                <li>
                    <button
                        className={`text-white ${view === 'conversations' ? 'font-bold' : ''}`}
                        onClick={() => setView('conversations')}
                    >
                        View Conversations
                    </button>
                </li>
                <li>
                    <button
                        className={`text-white ${view === 'agents' ? 'font-bold' : ''}`}
                        onClick={() => setView('agents')}
                    >
                        Agent Messages
                    </button>
                </li>
            </ul>
        </nav>
    );
};


const Dashboard = () => {
    const [view, setView] = useState('conversation');
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [selectedAgent, setSelectedAgent] = useState(null);

    const { data: agentsData, isLoading: agentsLoading, error: agentsError } = useQuery('agents', fetchAgents);
    const { data: conversationsData, isLoading: conversationsLoading, error: conversationsError } = useQuery('conversations', fetchConversations);

    if (agentsLoading || conversationsLoading) return <div>Loading...</div>;
    if (agentsError || conversationsError) return <div>Error loading data</div>;

    const handleAgentChange = (e) => {
        setSelectedAgent(e.target.value);
    };

    return (
        <div className="container mx-auto p-4">
            <Navbar view={view} setView={setView} />

            {view === 'agents' && (
                <>
                    <h1 className="text-3xl font-bold mb-4">Agent Messages Dashboard</h1>
                    {agentsData.agents.length > 0 ? (
                        <div className="mb-8">
                            <label htmlFor="agent-select" className="block text-sm font-medium text-gray-950 mb-2">
                                Select an agent:
                            </label>
                            <select
                                id="agent-select"
                                value={selectedAgent || ''}
                                onChange={handleAgentChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="">Select an agent</option>
                                {agentsData.agents.map(agentId => (
                                    <option key={agentId} value={agentId}>
                                        {agentId}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p>No agents available.</p>
                    )}
                    {selectedAgent && <AgentMessages agentId={selectedAgent} />}
                </>
            )}

            {view === 'conversations' && (
                <>
                    <h1 className="text-3xl font-bold mb-8">Conversations Dashboard</h1>
                    {selectedConversation ? (
                        <ConversationMessages conversationName={selectedConversation} />
                    ) : conversationsData && conversationsData.conversation_names.length > 0 ? (
                        <ul>
                            {conversationsData.conversation_names.map((conversation, index) => (
                                <li key={index} className="mb-2">
                                    <button
                                        className="text-blue-500 hover:underline"
                                        onClick={() => setSelectedConversation(conversation)}
                                    >
                                        {conversation}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No conversations available.</p>
                    )}
                </>
            )}
        </div >
    );
};

export default Dashboard;