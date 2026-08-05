import React, { useEffect, useMemo, useState, useRef } from 'react'
import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { detectDependencies } from '../utils/sandpackUtils'
import { useAppContext } from '../context/AppContext'
import SandpackErrorMonitor from './SandpackErrorMonitor'


// Watches for file edites inside Sandpack editor and saves changes to DB and live state
const SandpackFileWatcher = ({onLiveFilesChange})=>{
    const {sandpack} = useSandpack()
    const {files} = sandpack
    const {activeProject, updateProjectFiles} = useAppContext()
    const activeProjectRef = useRef(activeProject)

    useEffect(()=>{
        activeProjectRef.current = activeProject;
    },[activeProject])

    useEffect(()=>{
        const project = activeProjectRef.current;
        if(!project) return;
        const updatedFiles = {};
        let hasChanges = false;
        for (const [path,fileObj] of Object.entries(files)) {
            const fileCode = fileObj.code;
            updatedFiles[path] = fileCode;
            const orginalContent = typeof project.files[path] === "string" ? project.files[path] : project.files[path]?.content
            if(orginalContent !== undefined && orginalContent !== fileCode){
                hasChanges = true;
            }
        }
        onLiveFilesChange(updatedFiles)
        if(hasChanges){
            updateProjectFiles(updatedFiles)
        }
    },[files])
    return null
}

const PreviewPanel = ({Project, activeFile, showCode}) => {

    const [showErrorOverlay, setShowErrorOverlay] = useState(true)
    //Keep local state of files that updates as user types

    const [liveFiles, setLiveFiles] = useState(Project.files)
    const [prevProjectKey, setPrevProjectKey] = useState(`${Project._id}-${Project.version}`)

    const currentKey = `${Project._id}-${Project.version}`;

    if (prevProjectKey!==currentKey){
        setPrevProjectKey(currentKey);
        setLiveFiles(Project.files);
    }

    const handleLiveFilesChange = (newFiles)=>{
        setLiveFiles((prev)=>{
            let changed = false
            for (const [p,code] of Object.entries(newFiles)) {
                if(prev[p] !== code){
                    changed=true;
                    break;
                }
            }
            return changed ? newFiles : prev
        })
    }

    //Convert liveFiles to Sandpack format
    const sandpackFiles = useMemo(()=>{
        const spFiles = {};
        for(const [path, content] of Object.entries(liveFiles)){
            const fileCode = typeof content === "string" ? content : content?.content || "";
            spFiles[path] = {
                code: fileCode,
                active: path === activeFile,

            }
        }
        return spFiles
    },[liveFiles,activeFile])

    //Detect dependencies from import statements using liveFiles
    const dependencies = useMemo(()=>{
        return detectDependencies(liveFiles)
    },[liveFiles])


  return (
    <div className='h-full w-full'>
        <SandpackProvider key={Project._id} template='react' 
        files={sandpackFiles} 
        customSetup={{dependencies}} 
        options={{
            externalResources:[
                "https://cdn.tailwindcss.com",
                "https://cdnjs.Cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",

            ],
            classes:{
                "sp-wrapper" : "sp-wrapper",
                "sp-layout" : "sp-layout",
                "sp-preview" : "sp-preview"
            },
            logLevel: 0,
        }} 
        theme={{
            colors:{
                surface1: "#ffffff",
                surface2: "#f4f4f5",
                surface3: "#e4e4e7",
                clickable: "#71717a",
                base: "#09090b",
                disabled: "#a1a1aa",
                hover: "#18181b",
                accent: "#18181b",
                error: "#ef4444",
                errorSurface: "#fef2f2"
            },
            font:{
                body: "'Urbanist', system-ui, -apple-system, sans-sarif",
                mono: "'Geist Mono', ui-monospace, monospace",
                size: "13px",
                lineHeight: "1.6",
            }
        }}>
            <SandpackFileWatcher onLiveFilesChange={handleLiveFilesChange} />
            <SandpackErrorMonitor onErrorChange={setShowErrorOverlay}/>
            <SandpackLayout style={{
                height:"100%",
                border:"none",
                borderRadius:0,
                background:"transparent",
            }}>
                {showCode && (<SandpackCodeEditor showTabs showInlineErrors showInlineErrors
                 wrapContent style={{height: "100%", flex: 1, minWidth: 0}} />)}
                <SandpackPreview showNavigator={false} showRefreshButton showOpenInCodeSandbox={false} showSandpackErrorOverlay={showErrorOverlay} 
                 style={{
                    height: "100%", flex: showCode ? 1:2, minWidth:0
                 }} />
            </SandpackLayout>

        </SandpackProvider>
    </div>
  )
}

export default PreviewPanel