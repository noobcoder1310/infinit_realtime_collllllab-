import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const [documents, setDocuments] = useState([]);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await fetch('/api/documents', {
                headers: { 'auth-token': user.token }
            });
            const data = await response.json();
            if (response.ok) {
                setDocuments(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const createDocument = async () => {
        try {
            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': user.token
                },
                body: JSON.stringify({ title: 'Untitled Document' })
            });
            const data = await response.json();
            if (response.ok) {
                navigate(`/document/${data._id}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container" style={{ alignItems: 'normal', width: '100%', maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <h1>My Documents</h1>
                <div>
                    <span>Welcome, {user.username} </span>
                    <button onClick={logout} style={{ marginLeft: '1rem', backgroundColor: '#e74c3c' }}>Logout</button>
                </div>
            </div>

            <button onClick={createDocument} style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>+ New Document</button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', width: '100%' }}>
                {documents.map(doc => (
                    <div key={doc._id} className="card" onClick={() => navigate(`/document/${doc._id}`)}>
                        <h3>{doc.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: '#888' }}>Last modified: {new Date(doc.lastModified).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
