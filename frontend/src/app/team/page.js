'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchTeamData } from '@/components/api';
import CollapsibleTool from '@/components/collapsable';

const TeamPageContent = () => {
    const [teamData, setTeamData] = useState(null);
    const [error, setError] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const team_id = searchParams.get('team_id');

        if (!team_id) return;

        const getTeamData = async () => {
            try {
                const data = await fetchTeamData(team_id);
                console.log(data);
                setTeamData(data.data);
            } catch (err) {
                console.log(err.message);
                setError(err.message);
            }
        };

        getTeamData();
    }, [searchParams]);

    const handleSelectTeamClick = () => {
        const team_id = searchParams.get('team_id');
        router.push(`/chat?team_id=${team_id}`);
    };

    if (error) {
        return <div className="text-center text-red-500 mt-10">{error}</div>;
    }

    if (!teamData) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {teamData.map((agent, agentIndex) => (
                    <div key={agentIndex} className="bg-white shadow-lg rounded-lg p-6 flex flex-col text-gray-800">
                        <h1 className="text-2xl font-bold mb-4 text-center">{agent.name}</h1>
                        <h4 className="text-sm font-medium mb-4 text-center whitespace-pre-wrap flex-grow">{agent.prompt}</h4>

                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Tools:</h3>
                            {agent.tools.map((tool, toolIndex) => (
                                <CollapsibleTool
                                    key={toolIndex}
                                    title={tool.name}
                                    additionalText={tool.description}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="absolute bottom-4 right-4 space-x-6 p-20">
                <button disabled={true} className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded">
                    Regenerate Team (Not available)
                </button>
                <button className="bg-blue-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    onClick={handleSelectTeamClick}
                >
                    Select Team
                </button>
            </div>
        </div>
    );
};

const TeamPage = () => {
    return (
        <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
            <TeamPageContent />
        </Suspense>
    );
};

export default TeamPage;