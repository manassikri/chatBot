const express = require('express');
const http = require('http');
const path = require('path');
const formatMessage = require('./util/messages')
const {userJoin,getCurrentUser,userLeave,getRoomUsers}=require('./util/users');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
var bodyParser = require('body-parser')

const io = socketio(server);
const port = 3000;
const botName = 'ChatBot';

const user_name;
const user_room;
const user_code;


const {client,findDatabase} = require('./config/db');  
var urlencodedParser = bodyParser.urlencoded({ extended: false })
 
app.post('/chat.html', urlencodedParser, function (req, res) {
    console.log("new way");
    console.log(req.body.username);
    console.log(req.body.room);
    user_name = req.body.username;
    user_room = req.body.room;
    user_code = req.body.securityCode;


    res.sendFile(__dirname + '/public/chat.html');
    

})

async function getUsers(){
    return (await client).db("participantList").collection("participants");
}

async function getSecCode(){
    return (await client).db("participantList").collection("securtyCode");
}

// console.log(await findDatabase());

app.use(express.static(path.join(__dirname,'public')));
 
//runs when client connects
io.on('connection', async socket=>{
    const db = await getUsers();
    const code = await getSecCode();
    socket.on('joinRoom',({username,room,code})=>{

        const user =   userJoin(socket.id,username,room,code);
        console.log('I have joined the room and now Im getting details');
        console.log(user.id);
        console.log(user.username);
        console.log(user.room);
        socket.join(user.room);
        db.insertOne(

            {   socket_id : socket.id,
                username : user.username,
                room : user.room,
                securityCode :user.code
            });
        socket.emit('message',formatMessage(socket.id,botName,'Welcome to chatBot!!'));   //broadcast to client

        socket.broadcast.to(user.room).emit('message', formatMessage(socket.id,botName,`${user.username} has joined the chat`));   //broadcast to everyone but client itself
        //Send users and room info
        io.to(room).emit('roomUsers',{
        
            room:user.room,
            users:getRoomUsers(user.room)
        });
    });
    //listen for chat messages
    socket.on('chatMessage',msg =>{
        //get user
        console.log('On server side I will read the message');
        console.log(msg);
        const user = getCurrentUser(socket.id);
        if(user){
            console.log('user details');
            console.log(user);
            io.to(user.room).emit('message',formatMessage(socket.id,user.username,msg));
        }
    });

    socket.on('throwOut',id=>{
        console.log(id);
        const user = userLeave(id);
        const admin = code.findOne();
        if(user){
            db.deleteOne( { socket_id: id } )
            console.log("disconnecting socket")
            console.log(id);

            console.log("after leaving users left");
            console.log(getRoomUsers(user.room));
            io.to(user.room).emit('message',formatMessage(socket.id,botName,`${user.username} has been kicked out of the chat`)); //broadcast everyone
            //Send users and room info
            io.to(user.room).emit('roomUsers',{
        
                room:user.room,
                users:getRoomUsers(user.room)
            });

 
            
            
        }
    });
  
    socket.on('disconnect',()=>{

        const user = userLeave(socket.id);

        if(user){
            db.deleteOne( { socket_id: socket.id} )
            console.log("after leaving users left");
            console.log(getRoomUsers(user.room));
            io.to(user.room).emit('message',formatMessage(socket.id,botName,`${user.username} has left the chat`)); //broadcast everyone
            //Send users and room info
            io.to(user.room).emit('roomUsers',{
        
                room:user.room,
                users:getRoomUsers(user.room)
            });
        }
        
    });
});
server.listen(port,()=>{
    console.log(`App listening at http://localhost:${port}`)
}) ;