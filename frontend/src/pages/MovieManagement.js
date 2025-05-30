import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, Table } from 'react-bootstrap';

const MovieManagement = () => {
    const [movies, setMovies] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: '',
        start_date: '',
        end_date: '',
        screenings: [],
        room: 0
    });
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchMovies();
        fetchRooms();
    }, []);

    const fetchMovies = async () => {
        const response = await axios.get('http://localhost:5000/movies');
        setMovies(response.data);
    };

    const fetchRooms = async () => {
        const response = await axios.get('http://localhost:5000/rooms');
        setRooms(response.data);
        //console.log(response.data);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (time) => {
        const updatedScreenings = formData.screenings.includes(time)
            ? formData.screenings.filter(t => t !== time)
            : [...formData.screenings, time];
        setFormData({ ...formData, screenings: updatedScreenings });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editMode) {
            await axios.put(`http://localhost:5000/movies/${editId}`, formData);
        } else {
            await axios.post('http://localhost:5000/movies', formData);
        }
        fetchMovies();
        setFormData({
            title: '',
            description: '',
            duration: '',
            start_date: '',
            end_date: '',
            screenings: [],
            room: 0
        });
        setEditMode(false);
        setEditId(null);
    };

    const handleEdit = (movie) => {
        const formattedStartDate = new Date(movie.start_date).toISOString().split('T')[0];
        const formattedEndDate = new Date(movie.end_date).toISOString().split('T')[0];
        const screenings = movie.screenings || [];

        setFormData({
            title: movie.title,
            description: movie.description,
            duration: movie.duration,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            screenings: screenings,
            room: movie.room || 0
        });
        setEditMode(true);
        setEditId(movie.id);
    };

    const handleDelete = async (id) => {
        await axios.delete(`http://localhost:5000/movies/${id}`);
        fetchMovies();
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
                slots.push(time);
            }
        }
        return slots;
    };

    const formatDate = (date) => {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('-');
    };

    return (
        <Container>
            <h2>Manage Movies</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>Title</Form.Label>
                    <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control as="textarea" name="description" value={formData.description} onChange={handleChange} required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Duration (minutes)</Form.Label>
                    <Form.Control type="number" name="duration" value={formData.duration} onChange={handleChange} required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Room</Form.Label>
                    <Form.Control
                        as="select"
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        required
                    >
                        <option value="">-- Select Room --</option>
                        {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                                {room.name}
                            </option>
                        ))}
                    </Form.Control>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Screening Times</Form.Label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {generateTimeSlots().map(time => (
                            <Form.Check
                                key={time}
                                type="checkbox"
                                label={time.split(':')[0] + ':' + time.split(':')[1]}
                                checked={formData.screenings.includes(time)}
                                onChange={() => handleCheckboxChange(time)}
                            />
                        ))}
                    </div>
                </Form.Group>
                <Button type="submit">{editMode ? 'Update' : 'Add'} Movie</Button>
            </Form>
            <Table striped bordered hover className="mt-5">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Duration</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Room</th>
                        <th>Screening Times</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {movies.map(movie => (
                        <tr key={movie.id}>
                            <td>{movie.title}</td>
                            <td>{movie.description}</td>
                            <td>{movie.duration} minutes</td>
                            <td>{formatDate(movie.start_date)}</td>
                            <td>{formatDate(movie.end_date)}</td>
                            <td>{rooms[movie.room-1].name}</td>
                            <td>
                                {movie.screenings.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {movie.screenings.map((time, index) => (
                                            <li key={index}>{time.split(':')[0] + ':' + time.split(':')[1]}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span>No screenings</span>
                                )}
                            </td>
                            <td>
                                <Button variant="warning" onClick={() => handleEdit(movie)}>Edit</Button>
                                <Button variant="danger" onClick={() => handleDelete(movie.id)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default MovieManagement;
