
    
    const getLoginStatus = async () =>{
    
        const query = "SELECT * FROM users WHERE username = ?";
        const [results] = await db.promise().query(query, [username]);
        return results;
        
}
   
    const createUser = async () =>{
        const hash = await bcrypt.hash(password, 10);
        const createUserQuery = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
        const [result] = await db.promise().query(createUserQuery, [username, hash, role]);
    }

module.exports = {
    getLoginStatus,
    createUser
}

 

