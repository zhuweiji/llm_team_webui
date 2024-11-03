"use client"
import React, { useState } from 'react';
import { createTeam, getTaskStatus } from '@/components/api'
import { useRouter } from 'next/navigation';



const GetTeamRequirementsPage = () => {
    const [task, setTask] = useState('The task is to ');
    const [statusMessage, setStatusMessage] = useState('no state');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleInputChange = (e) => {
        const prefix = "The task is to ";
        let newValue = e.target.value;
        if (!newValue.startsWith(prefix)) {
            newValue = prefix + newValue.slice(prefix.length);
        }
        setTask(newValue);
    };

    function pollTaskStatus(taskId, onSuccess, onFailure, onProgress) {
        const intervalId = setInterval(async () => {
            try {
                const taskInfo = await getTaskStatus(taskId);
                switch (taskInfo.status) {
                    case 'completed':
                        clearInterval(intervalId);
                        onSuccess(taskInfo.result);
                        break;
                    case 'failed':
                        clearInterval(intervalId);
                        onFailure(taskInfo.result);
                        break;
                    case 'processing':
                    case 'pending':
                        onProgress(taskInfo.status);
                        break;
                }
            } catch (error) {
                console.error('Error checking task status:', error);
                onFailure(error);
                clearInterval(intervalId);
            }
        }, 1500);  // Check every 2.5 seconds
    }


    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            setStatusMessage('Preparing team creation...');

            console.log('Confirmed input:', task);
            const { task_id } = await createTeam(task);
            console.log('Team creation started, task ID:', task_id);
            setStatusMessage('Team creation started. This may take a few minutes...');

            pollTaskStatus(
                task_id,
                (result) => {
                    console.log('Team created successfully:', result);

                    setStatusMessage('Team created successfully!');
                    setTimeout(() => {
                        router.push('/chat', query = { 'team_id': result.team_id });
                    }, 3000);
                },
                (error) => {
                    console.error('Team creation failed:', error);
                    setStatusMessage('Failed to create team. Please try again.');
                },
                (status) => {
                    setStatusMessage(`Team creation ${status}...`);
                }
            );
        } catch (error) {
            console.error('Error starting team creation:', error);
            setStatusMessage('Failed to start team creation. Please try again.');
        } finally {
            setIsLoading(false);

        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white">
            <main className="flex-grow flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-lg">
                    <textarea
                        className="w-full h-80 p-4 text-lg bg-white text-black rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="The task is to:"
                        value={task}
                        onChange={handleInputChange}
                    />
                    <button
                        className="mt-4 w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        onClick={handleConfirm}
                    >
                        Confirm
                    </button>
                    <p>{statusMessage}</p>
                    {/* <p>loading: {isLoading}</p> */}
                </div>
            </main>
        </div>
    );
};

export default GetTeamRequirementsPage;