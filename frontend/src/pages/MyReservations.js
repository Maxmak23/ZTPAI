import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Table, Alert, Button } from 'react-bootstrap';

const MyReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/reservations/my', { 
                withCredentials: true 
            });
            setReservations(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch reservations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const formatDateTime = (datetime) => {
        if (!datetime) return '';
        const date = new Date(datetime);
        return date.toLocaleString();
    };

    if (loading) return <Container className="mt-5 text-center">Loading your reservations...</Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>My Reservations</h1>
                <Button 
                    variant="primary" 
                    onClick={fetchReservations}
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
            </div>

            {reservations.length === 0 ? (
                <div className="text-center mt-5">
                    <p>You don't have any reservations yet.</p>
                    <Link to="/" className="btn btn-primary">
                        Browse Movies
                    </Link>
                </div>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Movie</th>
                            <th>Screening Time</th>
                            <th>Seat</th>
                            <th>Reserved On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map(reservation => (
                            <tr key={reservation.id}>
                                <td>{reservation.movie_title} ({reservation.duration} min)</td>
                                <td>{reservation.screening_time.split(' ')[1]}</td>
                                <td>{reservation.seat_number}</td>
                                <td>{formatDateTime(reservation.reservation_time)}</td>
                                <td>
                                    <Link 
                                        to={`/reserve/${reservation.screening_id}`} 
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default MyReservations;