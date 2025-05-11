
    
    const getLoginStatus = async () =>{
    
        const query = "SELECT * FROM users WHERE username = ?";
        const [results] = await db.promise().query(query, [username]);
        return results;
        
}
module.exports = {
    getLoginStatus
}

