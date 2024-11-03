import React from 'react';
import Link from 'next/link';

const Homepage = () => {
    return (
        <div className="flex flex-col h-screen bg-grey-600 text-primary-fg">

            <main className="flex-grow flex items-center justify-center">
                <div className="space-x-4">
                    <Link href="/create_team" passHref>
                        <button className="px-6 py-3 bg-accent text-primary-fg rounded-lg hover:bg-accent-focus transition-colors duration-300">
                            Create New Team
                        </button>
                    </Link >
                    <Link href="/teams" passHref>
                        <button className="px-6 py-3 bg-secondary-bg text-primary-fg rounded-lg hover:bg-tertiary-bg transition-colors duration-300">
                            Select Existing Team
                        </button>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default Homepage;