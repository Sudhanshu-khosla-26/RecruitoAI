import React from 'react'
import Sidebar from '@/components/sidebar'
import { Button } from '@/components/button'
import { User } from 'lucide-react'

const page = () => {
    return (
        <div className="flex min-h-screen w-screen bg-gray-50">
            <Sidebar />
            <div className="w-full">

                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">

                        <div className="flex justify-between w-full items-center gap-4">
                            <span className="text-gray-600">
                                Welcome, <span className="text-blue-600 font-medium">Candidate Name</span>
                            </span>
                            <Button variant="ghost" size="sm" className={" w-8 h-8 hover:bg-gray-300 text-black rounded-full border border-black"}>
                                <User className="w-4 h-4 rounded-full text-black" />
                            </Button>
                        </div>
                    </div>
                </header >
            </div>
        </div>
    )
}

export default page
