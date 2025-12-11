
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ApiSettings, DeploymentStatus, VercelEnvVar } from '../types';
import './VercelDeployModal.css';

interface VercelDeployModalProps {
  settings: ApiSettings;
  onClose: () => void;
  onOpenSettings: () => void;
}

interface FileEntry {
  name: string;
  path: string;
  content: string;
  size: number;
}

const VercelDeployModal: React.FC<VercelDeployModalProps> = ({
  settings,
  onClose,
  onOpenSettings
}) => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [projectName, setProjectName] = useState('');
  const [framework, setFramework] = useState('nextjs');
  const [deployStatus, setDeployStatus] = useState<DeploymentStatus>({
    status: 'idle',
    message: ''
  });
  const [envVars, setEnvVars] = useState<VercelEnvVar[]>([
    { key: 'OPENROUTER_API_KEY', value: settings.openRouterKey || '', target: ['production', 'preview'], type: 'secret' },
    { key: 'DATAFORSEO_LOGIN', value: settings.dataForSeoLogin || '', target: ['production', 'preview'], type: 'secret' },
    { key: 'DATAFORSEO_PASSWORD', value: settings.dataForSeoPassword || '', target: ['production', 'preview'], type: 'secret' },
  ]);
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processZipFile = async (file: File) => {
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
    const zip = await JSZip.loadAsync(file);
    const entries: FileEntry[] = [];

    const promises = Object.keys(zip.files).map(async (filename) => {
      const zipEntry = zip.files[filename];
      if (!zipEntry.dir) {
        try {
          const content = await zipEntry.async('string');
          entries.push({
            name: filename.split('/').pop() || filename,
            path: filename,
            content,
            size: content.length
          });
        } catch {
          // Binary file, skip or handle differently
          const blob = await zipEntry.async('blob');
          entries.push({
            name: filename.split('/').pop() || filename,
            path: filename,
            content: '[Binary File]',
            size: blob.size
          });
        }
      }
    });

    await Promise.all(promises);
    setFiles(entries);

    // Auto-detect project name from package.json
    const packageJson = entries.find(f => f.name === 'package.json');
    if (packageJson && packageJson.content !== '[Binary File]') {
      try {
        const pkg = JSON.parse(packageJson.content);
        if (pkg.name) {
          setProjectName(pkg.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase());
        }
      } catch {}
    }

    // Auto-detect framework
    const hasNextConfig = entries.some(f => f.name === 'next.config.js' || f.name === 'next.config.mjs');
    const hasViteConfig = entries.some(f => f.name === 'vite.config.js' || f.name === 'vite.config.ts');
    const hasNuxtConfig = entries.some(f => f.name === 'nuxt.config.js' || f.name === 'nuxt.config.ts');
    
    if (hasNextConfig) setFramework('nextjs');
    else if (hasViteConfig) setFramework('vite');
    else if (hasNuxtConfig) setFramework('nuxtjs');
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      if (file.name.endsWith('.zip')) {
        setDeployStatus({ status: 'uploading', message: 'Processing ZIP file...' });
        try {
          await processZipFile(file);
          setDeployStatus({ status: 'idle', message: '' });
        } catch (err: any) {
          setDeployStatus({ status: 'error', message: 'Failed to process ZIP: ' + err.message });
        }
      } else {
        setDeployStatus({ status: 'error', message: 'Please upload a ZIP file' });
      }
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const file = selectedFiles[0];
      if (file.name.endsWith('.zip')) {
        setDeployStatus({ status: 'uploading', message: 'Processing ZIP file...' });
        try {
          await processZipFile(file);
          setDeployStatus({ status: 'idle', message: '' });
        } catch (err: any) {
          setDeployStatus({ status: 'error', message: 'Failed to process ZIP: ' + err.message });
        }
      } else {
        setDeployStatus({ status: 'error', message: 'Please upload a ZIP file' });
      }
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '', target: ['production', 'preview'], type: 'plain' }]);
  };

  const updateEnvVar = (index: number, field: keyof VercelEnvVar, value: any) => {
    const updated = [...envVars];
    updated[index] = { ...updated[index], [field]: value };
    setEnvVars(updated);
  };

  useEffect(() => {
    // Ensure env vars stay in sync with any settings that were prefilled from Vercel environment variables
    setEnvVars(prev => {
      const defaults: VercelEnvVar[] = [
        { key: 'OPENROUTER_API_KEY', value: settings.openRouterKey || '', target: ['production', 'preview'], type: 'secret' },
        { key: 'DATAFORSEO_LOGIN', value: settings.dataForSeoLogin || '', target: ['production', 'preview'], type: 'secret' },
        { key: 'DATAFORSEO_PASSWORD', value: settings.dataForSeoPassword || '', target: ['production', 'preview'], type: 'secret' }
      ];

      const preserved = prev.filter(env => !defaults.some(def => def.key === env.key));

      const mergedDefaults = defaults.map(def => {
        const existing = prev.find(env => env.key === def.key);
        return { ...def, value: def.value || existing?.value || '' };
      });

      return [...mergedDefaults, ...preserved];
    });
  }, [settings.openRouterKey, settings.dataForSeoLogin, settings.dataForSeoPassword]);

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const deployToVercel = async () => {
    if (!settings.vercelToken) {
      setDeployStatus({ status: 'error', message: 'Please configure your Vercel token in Settings' });
      return;
    }

    if (files.length === 0) {
      setDeployStatus({ status: 'error', message: 'Please upload a ZIP file first' });
      return;
    }

    if (!projectName.trim()) {
      setDeployStatus({ status: 'error', message: 'Please enter a project name' });
      return;
    }

    try {
      setDeployStatus({ status: 'building', message: 'Creating project on Vercel...' });

      // Prepare files for Vercel API
      const vercelFiles = files
        .filter(f => f.content !== '[Binary File]')
        .map(f => ({
          file: f.path,
          data: btoa(unescape(encodeURIComponent(f.content)))
        }));

      // Create deployment
      const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: projectName,
          files: vercelFiles,
          projectSettings: {
            framework: framework === 'static' ? null : framework,
            buildCommand: framework === 'static' ? null : undefined,
            outputDirectory: framework === 'static' ? '.' : undefined
          },
          target: 'production'
        })
      });

      if (!deployResponse.ok) {
        const errorData = await deployResponse.json();
        throw new Error(errorData.error?.message || `Deployment failed: ${deployResponse.status}`);
      }

      const deployData = await deployResponse.json();
      
      setDeployStatus({ 
        status: 'deploying', 
        message: 'Deployment created! Setting environment variables...',
        deploymentId: deployData.id,
        projectId: deployData.projectId
      });

      // Set environment variables
      const activeEnvVars = envVars.filter(e => e.key && e.value);
      
      for (const envVar of activeEnvVars) {
        try {
          await fetch(`https://api.vercel.com/v10/projects/${deployData.projectId}/env`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${settings.vercelToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: envVar.key,
              value: envVar.value,
              target: envVar.target,
              type: envVar.type
            })
          });
        } catch (envError) {
          console.log('Env var may already exist:', envVar.key);
        }
      }

      // Poll for deployment status
      let attempts = 0;
      const maxAttempts = 60;
      
      const checkStatus = async () => {
        attempts++;
        const statusResponse = await fetch(`https://api.vercel.com/v13/deployments/${deployData.id}`, {
          headers: {
            'Authorization': `Bearer ${settings.vercelToken}`
          }
        });
        
        const statusData = await statusResponse.json();
        
        if (statusData.readyState === 'READY') {
          setDeployStatus({
            status: 'ready',
            message: 'Deployment successful!',
            url: `https://${statusData.url}`,
            deploymentId: deployData.id,
            projectId: deployData.projectId
          });
        } else if (statusData.readyState === 'ERROR') {
          setDeployStatus({
            status: 'error',
            message: 'Deployment failed. Check Vercel dashboard for details.'
          });
        } else if (attempts < maxAttempts) {
          setDeployStatus({
            status: 'deploying',
            message: `Building... (${statusData.readyState || 'QUEUED'})`,
            deploymentId: deployData.id
          });
          setTimeout(checkStatus, 3000);
        } else {
          setDeployStatus({
            status: 'ready',
            message: 'Deployment in progress. Check Vercel dashboard.',
            url: `https://${statusData.url || deployData.url}`,
            deploymentId: deployData.id
          });
        }
      };
      
      setTimeout(checkStatus, 2000);

    } catch (error: any) {
      setDeployStatus({
        status: 'error',
        message: error.message || 'Deployment failed'
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx': return 'fab fa-js-square text-yellow';
      case 'ts':
      case 'tsx': return 'fab fa-js-square text-blue';
      case 'html': return 'fab fa-html5 text-orange';
      case 'css': return 'fab fa-css3-alt text-blue';
      case 'json': return 'fas fa-code text-green';
      case 'md': return 'fas fa-file-alt text-gray';
      default: return 'fas fa-file text-gray';
    }
  };

  return (
    <div className="deploy-overlay" onClick={onClose}>
      <div className="deploy-modal" onClick={e => e.stopPropagation()}>
        <div className="deploy-header">
          <div className="deploy-header-content">
            <div className="vercel-logo">
              <svg height="24" viewBox="0 0 75 65" fill="white">
                <path d="M37.59.25l36.95 64H.64l36.95-64z"></path>
              </svg>
            </div>
            <div>
              <h3>Deploy to Vercel</h3>
              <p>Upload your project and deploy with one click</p>
            </div>
          </div>
          <button className="deploy-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="deploy-body">
          {!settings.vercelToken ? (
            <div className="no-token-warning">
              <div className="warning-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h4>Vercel Token Required</h4>
              <p>Please configure your Vercel access token to enable deployments.</p>
              <button className="configure-token-btn" onClick={() => { onClose(); onOpenSettings(); }}>
                <i className="fas fa-cog"></i> Configure in Settings
              </button>
            </div>
          ) : (
            <>
              {/* Upload Zone */}
              <div 
                className={`upload-zone ${dragActive ? 'drag-active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".zip"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {files.length === 0 ? (
                  <>
                    <div className="upload-icon">
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <h4>Drop your ZIP file here</h4>
                    <p>or click to browse</p>
                    <span className="upload-hint">Supports .zip files containing your project</span>
                  </>
                ) : (
                  <>
                    <div className="upload-success">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <h4>{files.length} files loaded</h4>
                    <p>Click to upload a different file</p>
                  </>
                )}
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="files-section">
                  <div className="files-header">
                    <h4><i className="fas fa-folder-open"></i> Project Files</h4>
                    <span className="file-count">{files.length} files</span>
                  </div>
                  <div className="files-list">
                    {files.slice(0, 10).map((file, i) => (
                      <div key={i} className="file-item">
                        <i className={getFileIcon(file.name)}></i>
                        <span className="file-path">{file.path}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                    {files.length > 10 && (
                      <div className="files-more">
                        + {files.length - 10} more files
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Project Configuration */}
              {files.length > 0 && (
                <div className="config-section">
                  <h4><i className="fas fa-cog"></i> Project Configuration</h4>
                  
                  <div className="config-grid">
                    <div className="config-field">
                      <label>Project Name</label>
                      <input 
                        type="text"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        placeholder="my-project"
                      />
                    </div>
                    <div className="config-field">
                      <label>Framework</label>
                      <select value={framework} onChange={e => setFramework(e.target.value)}>
                        <option value="nextjs">Next.js</option>
                        <option value="vite">Vite</option>
                        <option value="create-react-app">Create React App</option>
                        <option value="nuxtjs">Nuxt.js</option>
                        <option value="svelte">SvelteKit</option>
                        <option value="astro">Astro</option>
                        <option value="static">Static HTML</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Environment Variables */}
              {files.length > 0 && (
                <div className="env-section">
                  <div className="env-header" onClick={() => setShowEnvVars(!showEnvVars)}>
                    <h4>
                      <i className="fas fa-key"></i> Environment Variables
                      <span className="env-count">{envVars.filter(e => e.key && e.value).length} configured</span>
                    </h4>
                    <i className={`fas fa-chevron-${showEnvVars ? 'up' : 'down'}`}></i>
                  </div>
                  
                  {showEnvVars && (
                    <div className="env-content">
                      <p className="env-hint">
                        <i className="fas fa-info-circle"></i>
                        These environment variables will be set in your Vercel project. API keys from your settings are pre-filled.
                      </p>
                      
                      <div className="env-list">
                        {envVars.map((envVar, i) => (
                          <div key={i} className="env-item">
                            <input 
                              type="text"
                              value={envVar.key}
                              onChange={e => updateEnvVar(i, 'key', e.target.value)}
                              placeholder="KEY_NAME"
                              className="env-key"
                            />
                            <input 
                              type={envVar.type === 'secret' ? 'password' : 'text'}
                              value={envVar.value}
                              onChange={e => updateEnvVar(i, 'value', e.target.value)}
                              placeholder="value"
                              className="env-value"
                            />
                            <select 
                              value={envVar.type}
                              onChange={e => updateEnvVar(i, 'type', e.target.value)}
                              className="env-type"
                            >
                              <option value="plain">Plain</option>
                              <option value="secret">Secret</option>
                            </select>
                            <button className="env-remove" onClick={() => removeEnvVar(i)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <button className="add-env-btn" onClick={addEnvVar}>
                        <i className="fas fa-plus"></i> Add Variable
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Deploy Status */}
              {deployStatus.status !== 'idle' && (
                <div className={`deploy-status status-${deployStatus.status}`}>
                  <div className="status-icon">
                    {deployStatus.status === 'uploading' && <i className="fas fa-spinner fa-spin"></i>}
                    {deployStatus.status === 'building' && <i className="fas fa-hammer fa-bounce"></i>}
                    {deployStatus.status === 'deploying' && <i className="fas fa-rocket fa-shake"></i>}
                    {deployStatus.status === 'ready' && <i className="fas fa-check-circle"></i>}
                    {deployStatus.status === 'error' && <i className="fas fa-exclamation-circle"></i>}
                  </div>
                  <div className="status-content">
                    <p className="status-message">{deployStatus.message}</p>
                    {deployStatus.url && (
                      <a href={deployStatus.url} target="_blank" rel="noreferrer" className="deployment-url">
                        <i className="fas fa-external-link-alt"></i> {deployStatus.url}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Deploy Button */}
              {files.length > 0 && (
                <button 
                  className="deploy-btn"
                  onClick={deployToVercel}
                  disabled={deployStatus.status === 'building' || deployStatus.status === 'deploying' || deployStatus.status === 'uploading'}
                >
                  {deployStatus.status === 'building' || deployStatus.status === 'deploying' ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Deploying...
                    </>
                  ) : deployStatus.status === 'ready' ? (
                    <>
                      <i className="fas fa-redo"></i>
                      Deploy Again
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket"></i>
                      Deploy to Vercel
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VercelDeployModal;
