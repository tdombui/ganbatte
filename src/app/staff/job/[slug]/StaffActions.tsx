'use client'

import { ChangeEvent, useRef } from 'react'
import { Camera, Upload, X } from 'lucide-react'

interface Job {
    id: string;
    status?: string;
    photo_urls: string[];
}

export interface StaffActionsProps {
    job: Job;
    uploading?: boolean;
    onStatusChange: (newStatus: string) => void;
    onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    onDeletePhoto: (url: string) => void;
}

export default function StaffActions({ job, uploading, onStatusChange, onFileUpload, onDeletePhoto }: StaffActionsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleTakePhotoClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute('capture', 'environment')
            fileInputRef.current.click()
        }
    }

    const handleUploadFileClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('capture')
            fileInputRef.current.click()
        }
    }

    return (
        <div className="space-y-6 bg-neutral-800/70 p-6 rounded-xl text-white mt-6">
            <h2 className="text-2xl font-bold">Staff Actions</h2>
            <div>
                <label htmlFor="status" className="block font-semibold mb-2">Update Status</label>
                <select
                    id="status"
                    value={job.status || 'pending'}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="bg-neutral-900 text-white w-full p-2 rounded"
                >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="delivered">Delivered</option>
                </select>
            </div>

            <div>
                <label className="block font-semibold mb-2">Upload Photo</label>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={onFileUpload}
                    className="hidden"
                />
                <div className="flex gap-4">
                    <button
                        onClick={handleTakePhotoClick}
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded w-full"
                    >
                        <Camera size={18} />
                        Take Photo
                    </button>
                    <button
                        onClick={handleUploadFileClick}
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded w-full"
                    >
                        <Upload size={18} />
                        Upload File
                    </button>
                </div>
                {uploading && <p className="text-sm mt-2">Uploading...</p>}
            </div>

            {job.photo_urls && job.photo_urls.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-2">Photos</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {(job.photo_urls || []).map(url => (
                            <div key={url} className="relative">
                                <img src={url} alt="Job photo" className="rounded-lg object-cover" />
                                <button
                                    onClick={() => onDeletePhoto(url)}
                                    className="absolute top-1 right-1 bg-red-600/70 hover:bg-red-600 text-white rounded-full p-0.5"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
} 