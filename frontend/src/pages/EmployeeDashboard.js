import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Alert, Badge, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
    const [screenings, setScreenings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchScreenings = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/screenings_stats', { 
                withCredentials: true 
            });
            setScreenings(response.data.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch screening statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScreenings();
    }, []);

    const formatDateTime = (datetime) => {
        if (!datetime) return '';
        const date = new Date(datetime);
        return date.toLocaleString();
    };

    const renderSeatMap = (screening) => {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const seatsPerRow = 10;
        
        return (
            <div className="seat-map-preview">
                {rows.map(row => (
                    <div key={row} className="seat-row mb-1">
                        {Array.from({ length: seatsPerRow }, (_, i) => {
                            const seatNumber = `${row}${i + 1}`;
                            const isReserved = screening.reserved_seat_numbers.includes(seatNumber);
                            
                            return (
                                <span
                                    key={i}
                                    className={`seat-sm ${isReserved ? 'reserved' : 'available'}`}
                                    title={`Seat ${seatNumber}`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <Container className="mt-5 text-center">Loading screening statistics...</Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <Container className="mt-4">
            <h1 className="mb-4">Employee Dashboard</h1>
            
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-white bg-primary mb-3">
                        <Card.Body>
                            <Card.Title>Total Screenings</Card.Title>
                            <Card.Text className="display-4">{screenings.length}</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-white bg-success mb-3">
                        <Card.Body>
                            <Card.Title>Average Occupancy</Card.Title>
                            <Card.Text className="display-4">
                                {screenings.length > 0 
                                    ? Math.round(screenings.reduce((sum, s) => sum + s.occupancy_rate, 0) / screenings.length) 
                                    : 0}%
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-white bg-info mb-3">
                        <Card.Body>
                            <Card.Title>Total Seats Available</Card.Title>
                            <Card.Text className="display-4">
                                {screenings.reduce((sum, s) => sum + s.available_seats, 0)}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Table striped bordered hover responsive className="mt-4">
                <thead>
                    <tr>
                        <th>Movie</th>
                        <th>Screening Time</th>
                        <th>Duration</th>
                        <th>Occupancy</th>
                        <th>Seats</th>
                        <th>Seat Map</th>
                    </tr>
                </thead>
                <tbody>
                    {screenings.map(screening => (
                        <tr key={screening.id}>
                            <td>{screening.movie_title}</td>
                            <td>{screening.screening_time.split(' ')[1]}</td>
                            <td>{screening.duration} min</td>
                            <td>
                                <div className="d-flex align-items-center">
                                    <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                                        <div 
                                            className={`progress-bar ${screening.occupancy_rate > 80 ? 'bg-danger' : 
                                                screening.occupancy_rate > 50 ? 'bg-warning' : 'bg-success'}`}
                                            role="progressbar"
                                            style={{ width: `${screening.occupancy_rate}%` }}
                                            aria-valuenow={screening.occupancy_rate}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        />
                                    </div>
                                    <span>{screening.occupancy_rate}%</span>
                                </div>
                                <small className="text-muted">
                                    {screening.reserved_seats} / {screening.total_seats}
                                </small>
                            </td>
                            <td>
                                <Badge bg="success" className="me-1">
                                    {screening.available_seats} Free
                                </Badge>
                                <Badge bg="danger">
                                    {screening.reserved_seats} Taken
                                </Badge>
                            </td>
                            <td>
                                <div 
                                    className="seat-map-preview-container"
                                    onClick={() => navigate(`/reserve/${screening.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {renderSeatMap(screening)}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default EmployeeDashboard;