'use client'

import { useRef, useState } from 'react'

export default function MobileFileUploadTest() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [debugInfo, setDebugInfo] = useState<string>('')

    const showDebug = (message: string) => {
        console.log('🔍 Debug:', message)
        setDebugInfo(message)
        setTimeout(() => setDebugInfo(''), 10000)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        showDebug(`📄 File selected: ${file?.name || 'none'} (${file?.size || 0} bytes)`)
        
        if (file) {
            setSelectedFile(file)
            showDebug(`✅ File successfully selected: ${file.name}`)
        } else {
            setSelectedFile(null)
            showDebug('❌ No file selected')
        }
    }

    const testCamera = () => {
        showDebug('📸 Testing camera...')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
            fileInputRef.current.setAttribute('accept', 'image/*')
            fileInputRef.current.setAttribute('capture', 'environment')
            fileInputRef.current.click()
        }
    }

    const testFilePicker = () => {
        showDebug('📁 Testing file picker...')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
            fileInputRef.current.setAttribute('accept', 'image/*,.pdf,.doc,.docx')
            fileInputRef.current.removeAttribute('capture')
            fileInputRef.current.click()
        }
    }

    const testDirectClick = () => {
        showDebug('🚨 Direct file input test...')
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-md mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-center">📱 Mobile File Upload Test</h1>
                
                {/* Debug info */}
                {debugInfo && (
                    <div className="bg-yellow-900/50 border border-yellow-600 p-3 rounded-lg">
                        <p className="text-yellow-200 text-sm font-mono">{debugInfo}</p>
                    </div>
                )}
                
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                
                {/* Test buttons */}
                <div className="space-y-4">
                    <button
                        onClick={testCamera}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        📸 Test Camera
                    </button>
                    
                    <button
                        onClick={testFilePicker}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        📁 Test File Picker
                    </button>
                    
                    <button
                        onClick={testDirectClick}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        🚨 Direct File Input Test
                    </button>
                </div>
                
                {/* Selected file info */}
                {selectedFile && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Selected File:</h3>
                        <p><strong>Name:</strong> {selectedFile.name}</p>
                        <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                        <p><strong>Type:</strong> {selectedFile.type}</p>
                        <p><strong>Last Modified:</strong> {new Date(selectedFile.lastModified).toLocaleString()}</p>
                    </div>
                )}
                
                {/* Device info */}
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Device Info:</h3>
                    <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                    <p><strong>Platform:</strong> {navigator.platform}</p>
                    <p><strong>Mobile:</strong> {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Yes' : 'No'}</p>
                </div>
            </div>
        </div>
    )
} 