import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Alert, Badge, Dropdown, Spinner } from 'react-bootstrap';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(null);

    const roles = ['client', 'employee', 'manager', 'admin'];
    const roleColors = {
        client: 'secondary',
        employee: 'primary',
        manager: 'warning',
        admin: 'danger'
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/admin/users', { 
                withCredentials: true 
            });
            setUsers(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId, newRole) => {
        setUpdating(userId);
        try {
            await axios.put(
                `http://localhost:5000/admin/users/${userId}/role`,
                { role: newRole },
                { withCredentials: true }
            );
            setUsers(users.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update user role');
        } finally {
            setUpdating(null);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (loading) return (
        <Container className="mt-5 text-center">
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading users...</span>
            </Spinner>
        </Container>
    );

    if (error) return (
        <Container className="mt-5">
            <Alert variant="danger">{error}</Alert>
        </Container>
    );

    return (
        <Container className="mt-4">
            <h1 className="mb-4">Admin Panel - User Management</h1>
            
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Current Role</th>
                        <th>Change Role</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>
                                <Badge bg={roleColors[user.role]}>
                                    {user.role}
                                </Badge>
                            </td>
                            <td>
                                <Dropdown>
                                    <Dropdown.Toggle variant="outline-secondary" size="sm">
                                        {updating === user.id ? (
                                            <Spinner animation="border" size="sm" />
                                        ) : (
                                            'Change Role'
                                        )}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                        {roles.map(role => (
                                            <Dropdown.Item 
                                                key={role}
                                                onClick={() => updateUserRole(user.id, role)}
                                                disabled={user.role === role || updating === user.id}
                                            >
                                                <Badge bg={roleColors[role]} className="me-2">
                                                    {role}
                                                </Badge>
                                                {user.role === role && '(Current)'}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default AdminPanel;