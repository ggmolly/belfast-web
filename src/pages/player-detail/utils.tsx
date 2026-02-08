import { Coins, Droplets, Gem } from 'lucide-react'

export const SHIP_TYPE_OPTIONS = [
	{ id: 1, label: 'Destroyer (DD)' },
	{ id: 2, label: 'Light Cruiser (CL)' },
	{ id: 3, label: 'Heavy Cruiser (CA)' },
	{ id: 4, label: 'Battleship (BB)' },
	{ id: 5, label: 'Aircraft Carrier (CV)' },
	{ id: 6, label: 'Submarine (SS)' },
	{ id: 7, label: 'Repair Ship' },
	{ id: 8, label: 'Munitions Ship' },
	{ id: 9, label: 'Submarine Tender' },
	{ id: 10, label: 'Light Carrier (CVL)' },
	{ id: 11, label: 'Aviation Battleship (BBV)' },
	{ id: 12, label: 'Aviation Cruiser (CLV)' },
] as const

export const KICK_REASONS = [
	{ id: 1, label: 'Logged in on another device' },
	{ id: 2, label: 'Server maintenance' },
	{ id: 3, label: 'Game update' },
	{ id: 4, label: 'Offline too long' },
	{ id: 5, label: 'Connection lost' },
	{ id: 6, label: 'Connection to server lost' },
	{ id: 7, label: 'Data validation failed' },
	{ id: 199, label: 'Login data expired' },
] as const

export const getResourceIcon = (name: string) => {
	if (name.includes('Oil')) return <Droplets className="h-4 w-4 text-sky-500" />
	if (name.includes('Coin')) return <Coins className="h-4 w-4 text-yellow-500" />
	if (name.includes('Gem')) return <Gem className="h-4 w-4 text-rose-500" />
	return <div className="h-4 w-4 rounded-full bg-gray-500" />
}
