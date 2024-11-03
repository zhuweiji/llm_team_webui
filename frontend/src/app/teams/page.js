'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { backend_url } from '@/components/api';

export default function TeamsPage() {
    const [teams, setTeams] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch(`${backend_url}/teams`);
                const { data } = await response.json();
                setTeams(data);
            } catch (error) {
                console.error('Error fetching teams:', error);
            }
        };

        fetchTeams();
    }, []);

    const handleTeamClick = (shortId) => {
        router.push(`/team?team_id=${shortId}`);
    };

    return (
        <div className="min-h-screen bg-gray-700 flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-gray-800">
                <h1 className="text-2xl font-bold mb-6 text-center">Previously Created Teams</h1>
                <ul className="space-y-2">
                    {teams.map((shortId) => (
                        <li
                            key={shortId}
                            onClick={() => handleTeamClick(shortId)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded cursor-pointer text-center transition duration-300 ease-in-out"
                        >
                            {shortId}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}