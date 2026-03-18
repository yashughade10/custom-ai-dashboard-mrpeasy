'use client';
import { SidebarTrigger } from '../ui/sidebar'
import { Button } from '../ui/button'

function AppHeader() {
    return (
        <>
            <div className='flex justify-between items-center p-4 border-b'>
                <SidebarTrigger className="-ml-1" />
            </div>
        </>
    )
}

export default AppHeader