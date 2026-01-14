import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SAVE_INTERVAL_MS = 2000;

export default function Editor() {
    const { id: documentId } = useParams();
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [value, setValue] = useState('');
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('');
    const navigate = useNavigate();

    // Ref to track if change is from socket (remote) to avoid loop
    const isRemoteChange = useRef(false);

    useEffect(() => {
        const s = io('http://localhost:5000');
        setSocket(s);
        return () => s.disconnect();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.emit('join-document', documentId);

            socket.on('receive-changes', (delta) => {
                isRemoteChange.current = true;
                setValue(delta);
                isRemoteChange.current = false;
            });
        }
    }, [socket, documentId]);

    useEffect(() => {
        // Load initial document
        fetch(`/api/documents/${documentId}`, {
            headers: { 'auth-token': user.token }
        })
            .then(res => {
                if (!res.ok) throw new Error('Document loading failed');
                return res.json();
            })
            .then(data => {
                setTitle(data.title);
                setValue(data.content);
            })
            .catch(err => {
                console.error("Error fetching document:", err);
                setTitle("Error Loading Document");
            });
    }, [documentId, user.token]);

    useEffect(() => {
        if (socket && !isRemoteChange.current) {
            socket.emit('send-changes', { documentId, delta: value });
            setStatus('Unsaved changes...');
        }

        // Auto-save logic could go here
        const interval = dboSave();
        return () => clearInterval(interval);
    }, [value, socket, documentId]);

    const dboSave = () => {
        // Debounce or interval save
        return setInterval(() => {
            if (socket) {
                socket.emit('save-document', { documentId, content: value });
                setStatus('Saved (Auto)');
            }
        }, SAVE_INTERVAL_MS);
    }

    const handleChange = (content, delta, source, editor) => {
        if (source !== 'user') return;
        setValue(content);
        setStatus('Typing...');
    }

    const manualSave = async () => {
        setStatus('Saving...');
        await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': user.token
            },
            body: JSON.stringify({ title, content: value })
        });
        setStatus('Saved');
    }

    const saveTitle = async () => {
        await manualSave();
    }

    return (
        <div className="container" style={{ maxWidth: '1000px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                <button onClick={() => navigate('/')}>&larr; Back</button>
                <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={saveTitle}
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', border: 'none', background: 'transparent', textAlign: 'center' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{status}</span>
                    <button onClick={manualSave} style={{ backgroundColor: '#4CAF50' }}>Save</button>
                </div>
            </div>
            <div className="editor-container" style={{ width: '100%', height: '70vh', backgroundColor: 'white', padding: '0' }}>
                <textarea
                    value={value}
                    onChange={(e) => handleChange(e.target.value, null, 'user')}
                    style={{
                        width: '100%',
                        height: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        border: 'none',
                        resize: 'none',
                        outline: 'none',
                        backgroundColor: 'white',
                        color: 'black'
                    }}
                    placeholder="Start typing your document here..."
                />
            </div>
        </div>
    );
}
