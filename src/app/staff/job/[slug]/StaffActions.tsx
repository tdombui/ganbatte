'use client'

import { ChangeEvent, useRef, useState, useEffect } from 'react'
import { Camera, Upload, X, FileText } from 'lucide-react'

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
    onConfirmPickup?: () => void;
}

export default function StaffActions({ job, uploading, onStatusChange, onFileUpload, onDeletePhoto, onConfirmPickup }: StaffActionsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadProgress, setUploadProgress] = useState<string>('')
    const [debugInfo, setDebugInfo] = useState<string>('')
    const [isMobile, setIsMobile] = useState(false)

    // Debug function to show info on screen
    const showDebug = (message: string) => {
        console.log('🔍 Debug:', message)
        setDebugInfo(message)
        setTimeout(() => setDebugInfo(''), 10000) // Keep debug longer
    }

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            setIsMobile(mobile)
            if (mobile) {
                showDebug('📱 Mobile device detected - using simple file input')
            } else {
                showDebug('🖥️ Desktop device detected')
            }
        }
        checkMobile()
    }, [])

    const handleTakePhotoClick = () => {
        showDebug('📸 Take Photo clicked')
        
        if (fileInputRef.current) {
            // Clear any previous files
            fileInputRef.current.value = ''
            
            // Simple approach: just accept images, let mobile decide camera vs gallery
            fileInputRef.current.setAttribute('accept', 'image/*')
            
            // For mobile, add capture attribute
            if (isMobile) {
                fileInputRef.current.setAttribute('capture', 'environment')
                showDebug('📱 Mobile: Opening camera/gallery...')
            } else {
                fileInputRef.current.removeAttribute('capture')
                showDebug('🖥️ Desktop: Opening file picker...')
            }
            
            // Click the input
            fileInputRef.current.click()
        } else {
            showDebug('❌ File input ref not found')
        }
    }

    const handleUploadFileClick = () => {
        showDebug('📁 Upload File clicked')
        
        if (fileInputRef.current) {
            // Clear any previous files
            fileInputRef.current.value = ''
            
            // Accept all file types
            fileInputRef.current.setAttribute('accept', 'image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls')
            
            // Remove capture attribute for file picker
            fileInputRef.current.removeAttribute('capture')
            
            showDebug('📁 Opening file picker...')
            fileInputRef.current.click()
        } else {
            showDebug('❌ File input ref not found')
        }
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        showDebug(`📄 File selected: ${file?.name || 'none'} (${file?.size || 0} bytes)`)
        
        if (!file) {
            showDebug('❌ No file selected')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showDebug('❌ File too large (>10MB)')
            alert('File size must be less than 10MB')
            return
        }

        // Show upload progress
        setUploadProgress(`📤 Uploading ${file.name}...`)
        showDebug(`🚀 Starting upload for ${file.name}`)
        
        // Call the parent upload handler
        onFileUpload(e)
        
        // Clear progress after a delay
        setTimeout(() => {
            setUploadProgress('')
            showDebug('✅ Upload process completed')
        }, 3000)
    }

    const isImageFile = (url: string) => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
        return imageExtensions.some(ext => url.toLowerCase().includes(ext))
    }

    const isPDFFile = (url: string) => {
        return url.toLowerCase().includes('.pdf')
    }

    const getFileIcon = (url: string) => {
        if (isImageFile(url)) return null // No icon for images
        if (isPDFFile(url)) return <FileText size={16} className="text-red-500" />
        return <FileText size={16} className="text-blue-500" />
    }

    return (
        <div className="space-y-6 bg-neutral-800/70 p-6 rounded-xl text-white mt-6">
            <h2 className="text-2xl font-bold">Staff Actions</h2>
            
            {/* Debug info display */}
            {debugInfo && (
                <div className="bg-yellow-900/50 border border-yellow-600 p-3 rounded-lg">
                    <p className="text-yellow-200 text-sm font-mono">{debugInfo}</p>
                </div>
            )}
            
            <div>
                <label htmlFor="status" className="block font-semibold mb-2">Update Status</label>
                <select
                    id="status"
                    value={job.status || 'booked'}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="bg-neutral-900 text-white w-full p-2 rounded"
                >
                    <option value="booked">Booked</option>
                    <option value="en_route">En Route</option>
                    <option value="loading">Loading</option>
                    <option value="driving">Driving to Dropoff</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* Confirm Pickup Complete Button - only show when at pickup location and not yet driving */}
            {job.status === 'loading' && onConfirmPickup && (
                <div>
                    <button
                        onClick={onConfirmPickup}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        ✅ Confirm Pickup Complete
                    </button>
                    <p className="text-sm text-gray-300 mt-1">Click when you&apos;ve finished loading and are ready to drive to dropoff</p>
                </div>
            )}

            <div>
                <label className="block font-semibold mb-2">Upload Files</label>
                
                {/* Single, simple file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                
                <div className="flex gap-4">
                    <button
                        onClick={handleTakePhotoClick}
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 text-white font-semibold py-2 px-4 rounded w-full transition-colors"
                    >
                        <Camera size={18} />
                        {isMobile ? '📱 Camera' : '📸 Take Photo'}
                    </button>
                    <button
                        onClick={handleUploadFileClick}
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-semibold py-2 px-4 rounded w-full transition-colors"
                    >
                        <Upload size={18} />
                        {isMobile ? '📱 Files' : '📁 Upload File'}
                    </button>
                </div>
                
                {/* Debug button for testing */}
                <button
                    onClick={() => {
                        showDebug(`🔍 Test button clicked - Mobile: ${isMobile}`)
                        console.log('File input:', fileInputRef.current)
                        if (fileInputRef.current) {
                            console.log('File input attributes:', {
                                accept: fileInputRef.current.accept,
                                capture: fileInputRef.current.getAttribute('capture'),
                                value: fileInputRef.current.value,
                                files: fileInputRef.current.files?.length || 0
                            })
                        }
                    }}
                    className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                    🔍 Debug File Input
                </button>
                
                {/* Direct file input test */}
                <button
                    onClick={() => {
                        showDebug('🔄 Testing file input directly...')
                        if (fileInputRef.current) {
                            fileInputRef.current.click()
                        }
                    }}
                    className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                    🚨 Direct File Input Test
                </button>
                
                {(uploading || uploadProgress) && (
                    <div className="mt-2">
                        <p className="text-sm text-blue-300">{uploadProgress || 'Uploading...'}</p>
                        {uploading && (
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                        )}
                    </div>
                )}
                
                <p className="text-xs text-gray-400 mt-2">
                    Supported: Images, PDFs, Documents (max 10MB)
                </p>
            </div>

            {job.photo_urls && job.photo_urls.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-2">Uploaded Files</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {job.photo_urls.map((url, index) => (
                            <div key={url} className="relative bg-neutral-900 rounded-lg p-2">
                                {isImageFile(url) ? (
                                    <img 
                                        src={url} 
                                        alt={`Job file ${index + 1}`} 
                                        className="w-full h-24 object-cover rounded-lg" 
                                    />
                                ) : (
                                    <div className="w-full h-24 flex items-center justify-center bg-neutral-800 rounded-lg">
                                        {getFileIcon(url)}
                                        <span className="text-xs text-gray-300 ml-2">
                                            {isPDFFile(url) ? 'PDF' : 'Document'}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={() => onDeletePhoto(url)}
                                    className="absolute top-1 right-1 bg-red-600/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                                <div className="mt-1">
                                    <a 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:text-blue-300 truncate block"
                                    >
                                        View File
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
} 