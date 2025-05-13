import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Modal } from 'react-bootstrap';

const ReserveSeat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [screening, setScreening] = useState(null);
    const [reservedSeats, setReservedSeats] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Cinema hall layout - 8 rows x 10 seats
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 10;

    useEffect(() => {
        const fetchScreening = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/screenings/${id}`);
                setScreening(response.data.data.screening);
                setReservedSeats(response.data.data.reservedSeats);
                setLoading(false);
            } catch (err) {
                setError('Failed to load screening details');
                setLoading(false);
            }
        };
        
        fetchScreening();
    }, [id]);

    const handleSeatClick = (seat) => {
        if (reservedSeats.includes(seat)) {
            return; // Seat is already reserved
        }
        setSelectedSeat(seat);
    };

    const handleReservation = async () => {
        try {
            await axios.post('http://localhost:5000/reservations', {
                screening_id: id,
                seat_number: selectedSeat
            }, { withCredentials: true });
            
            setShowModal(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to make reservation');
        }
    };

    if (loading) return <Container className="text-center mt-5">Loading...</Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!screening) return <Container className="mt-5"><Alert variant="warning">Screening not found</Alert></Container>;

    return (
        <Container className="mt-5">
            <h2>Reserve Seat for {screening.title}</h2>
            <p className="text-muted">
                {screening.screening_time}
            </p>
            
            <div className="screen mb-4">SCREEN</div>
            
            <div className="seat-map mb-4">
                {rows.map(row => (
                    <div key={row} className="seat-row mb-2">
                        <span className="row-label me-2">{row}</span>
                        {Array.from({ length: seatsPerRow }, (_, i) => {
                            const seatNumber = `${row}${i + 1}`;
                            const isReserved = reservedSeats.includes(seatNumber);
                            const isSelected = selectedSeat === seatNumber;
                            
                            return (
                                <button
                                    key={i}
                                    className={`seat ${isReserved ? 'reserved' : ''} ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSeatClick(seatNumber)}
                                    disabled={isReserved}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
            
            {selectedSeat && (
                <div className="reservation-controls">
                    <p>Selected seat: <strong>{selectedSeat}</strong></p>
                    <Button 
                        variant="primary" 
                        onClick={handleReservation}
                    >
                        Confirm Reservation
                    </Button>
                </div>
            )}
            
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            
            <Modal show={showModal} onHide={() => navigate('/')}>
                <Modal.Header closeButton>
                    <Modal.Title>Reservation Confirmed</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Your reservation for seat <strong>{selectedSeat}</strong> has been confirmed!</p>
                    <p>Movie: {screening.title}</p>
                    <p>Time: {screening.screening_time}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => navigate('/')}>
                        Back to Movies
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ReserveSeat;