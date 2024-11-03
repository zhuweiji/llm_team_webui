import React from 'react'
import Link from 'next/link'

export const Navbar = () => {
    return (
        <nav className="bg-secondary-bg p-4">
            <ul className="flex space-x-4">
                <li>
                    <Link href="/" className="text-primary-fg hover:text-accent">
                        Home
                    </Link>
                </li>
                <li>
                    <Link href="/dashboard" className="text-primary-fg hover:text-accent">
                        Dashboard
                    </Link>
                </li>
                <li>
                    <Link href="/chat" className="text-primary-fg hover:text-accent">
                        Chat
                    </Link>
                </li>
            </ul>
        </nav>
    )
}
