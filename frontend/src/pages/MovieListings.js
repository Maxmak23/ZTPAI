import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './style/MovieListings.css';

const MovieListings = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState([]);
    const currentDate = new Date().toISOString().split('T')[0];

    const fetchMovies = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/movies/playing?date=${currentDate}`);
            // Sort movies by start_date (newest first)
            console.log(response);
            const sortedMovies = response.data.data.sort((a, b) => 
                new Date(b.start_date) - new Date(a.start_date));
            setMovies(sortedMovies);

        } catch (error) {
            console.error("Error fetching movies:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        const response = await axios.get('http://localhost:5000/rooms');
        setRooms(response.data);
    };

    useEffect(() => {
        fetchMovies();
        fetchRooms();
    }, []);

    const formatTime = (time) => {
        return time ? time.substring(0, 5) : '';
    };

    return (
        <Container className="movie-listings">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Now Playing</h1>
                <Button 
                    variant="primary" 
                    onClick={fetchMovies}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </Button>
            </div>

            {loading ? (
                <div className="text-center">Loading movies...</div>
            ) : movies.length === 0 ? (
                <div className="text-center">No movies available today</div>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {movies.map(movie => (
                        <Col key={movie.id}>
                            <Card className="h-100 movie-card">
                                <Card.Img
                                    variant="top"
                                    src={`https://via.placeholder.com/300x450/333/ffffff?text=${encodeURIComponent(movie.title.substring(0, 15))}`}
                                    alt={movie.title}
                                />
                                <Card.Body>
                                    <Card.Title>{movie.title}</Card.Title>
                                    <Card.Text className="text-muted small">
                                        {movie.duration} min | {movie.start_date.split('T')[0]} to {movie.end_date.split('T')[0]} | {rooms[movie.room-1].name}
                                    </Card.Text>    
                                    <Card.Text>{movie.description}</Card.Text>
                                </Card.Body>
                                <Card.Footer>
                                    <div className="screening-times">
                                        <h6 className="mb-2">Today's screenings:</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            {movie.screenings && movie.screenings.length > 0 ? (
                                                movie.screenings.map((time, i) => (
                                                    <Link 
                                                        key={i} 
                                                        to={`/reserve/${movie.screeningIds[i]}`}
                                                        className="time-badge-link"
                                                    >
                                                        <span className="time-badge">
                                                            {formatTime(time)}
                                                        </span>
                                                    </Link>
                                                ))
                                            ) : (
                                                <span className="text-muted">No screenings today</span>
                                            )}
                                        </div>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default MovieListings;