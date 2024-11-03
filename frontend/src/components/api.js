// export const backend_url = 'https://llmteambackend.zhuhome.work'
// export const backend_ws_url = 'wss://llmteambackend.zhuhome.work'

export const backend_url = 'http://localhost:11251'
export const backend_ws_url = 'wss://localhost:11251'

export const fetchAgentMessages = async (agentId) => {
    const response = await fetch(`${backend_url}/dashboard/agents/${agentId}/messages`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    let data = await response.json();
    console.log(data)
    return data;
};

export const fetchAgents = async () => {
    const response = await fetch(`${backend_url}/dashboard/agents`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const fetchConversationHistory = async (conversationName) => {
    const response = await fetch(`${backend_url}/dashboard/conversations/${conversationName}/messages`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    let data = await response.json();
    console.log(data)
    return data;
};

export const fetchConversations = async () => {
    const response = await fetch(`${backend_url}/dashboard/conversations`);
    console.log(response)
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};


export async function createTeam(task) {
    const url = `${backend_url}/teams/create`;  // Adjust this if your API is on a different domain
    const data = { task: task };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating team:', error);
        throw error;  // Re-throw the error if you want calling code to handle it
    }
}

export async function getTaskStatus(taskId) {
    const url = `${backend_url}/tasks/${taskId}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}


export async function fetchTeamData(team_id) {
    const response = await fetch(`${backend_url}/teams/${team_id}`);
    if (!response.ok) {
        throw new Error('Team not found');
    }
    return response.json();
}

/**
 * Creates a new conversation with agents.
 * @param {Object} conversationData - The data for creating a conversation.
 * @param {string} conversationData.name - The name of the conversation.
 * @param {boolean} [conversationData.agent_tool_use_enabled=true] - Whether agent tool use is enabled.
 * @param {number} [conversationData.human_intervention_count=4] - The count of human interventions.
 * @param {Object[]} agents - Array of agent objects to be created.
 * @param {string} agents[].name - The name of the agent.
 * @param {string} [agents[].prompt=''] - The prompt for the agent.
 * @param {string[]} agents[].tools - Array of tool names for the agent.
 * @param {string} [agents[].agent_type] - The type of the agent (optional).
 * @returns {Promise} A promise that resolves with the created conversation data.
 */
export async function createConversation(conversation_id, conversationData, agents) {
    const url = `${backend_url}/c2/create`; // Adjust this if your API has a different base URL

    const requestBody = {
        create_conversation_request: {
            name: conversationData.name,
            conversation_id: conversation_id,
            agent_tool_use_enabled: conversationData.agent_tool_use_enabled ?? true,
            human_intervention_count: conversationData.human_intervention_count ?? 4
        },
        create_new_agent_requests: agents.map(agent => ({
            name: agent.name,
            prompt: agent.prompt || '',
            tools: agent.tools.map(i => i.name),
        }))
    };

    console.log(requestBody)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            let content = await response.json()
            console.error(content)
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating conversation:', error);
        throw error;
    }
}

export const loadMessages = async (team_id) => {
    const response = await fetch(`${backend_url}/teams/${team_id}/messages/load`);
    if (!response.ok) {
        throw new Error('Failed to load messages');
    }
    return response.json();
};