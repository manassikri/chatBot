const express = require('express');
const http = require('http');
const path = require('path');
const formatMessage = require('./util/messages')
const {userJoin,getCurrentUser,userLeave,getRoomUsers}=require('./util/users');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var swarl = require('sweetalert');
const io = socketio(server);
const port = 3000;
const botName = 'ChatBot';
app.use(cookieParser());


const {client,findDatabase} = require('./config/db');  
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const usersByRoom = {}
 
app.get('/chat', (req,res) => {
    return  res.redirect("/");
});

app.post('/chat', urlencodedParser, function (req, res) {

    
    const name = req.body.username;
    const room = req.body.room;
    const code = req.body.securityCode;
    console.log(room);
    const curr_users = getRoomUsers(room);
    console.log("finding active users");
    console.log(curr_users);
    const prtcpnts = curr_users.map(function(element){
        return `${element.username}`
    })
    console.log(prtcpnts);
    if(prtcpnts.includes(name)){
        console.log("already taken");
        // res.send(500,'The username has already been taken, kindly change the username.') 
        res.redirect('/');
        // swal('Username has already been taken. Kindly choose another is username');
        
       
    }else{
    
        res.cookie('username',name);
        res.cookie('room', room);
        res.cookie('code', code);
    
        res.sendFile(__dirname + '/public/chat.html');

    }

    // check if room key exists in usersByRoom
    // if not, usersByRoom[room] = new Set() and add this username inside this set
    // if yes, check if username is already there or not, throw error if yes, else add username into that list



});

async function getUsers(){
    return (await client).db("participantList").collection("participants");
}
// app.use('/chat', (req, res) => {
//     console.log("in use");
//     var cookie = getcookie(req);
//     console.log(cookie);
// });

// function getcookie(req) {
//     var cookie = req.headers.cookie;
//     // user=someone; session=QyhYzXhkTZawIb5qSl3KKyPVN (this is my cookie i get)
//     return cookie
// }

async function getSecCode(){
    return (await client).db("participantList").collection("securtyCode");
}
async function findAdmin(code){
    return await code.findOne();
}
// console.log(await findDatabase());

app.use(express.static(path.join(__dirname,'public')));
 
//runs when client connects
io.on('connection', async socket=>{
    const db = await getUsers();
    const code = await getSecCode();

    socket.on('joinRoom',({username, room, code})=> {

        const user = userJoin(socket.id, username, room, code);

        socket.join(user.room);
        
        db.insertOne({
            socket_id: socket.id,
            username: user.username,
            room: user.room,
            securityCode: user.code
        });

        socket.emit('message', formatMessage(socket.id,botName,'Welcome to chatBot!!'));   //broadcast to client

        socket.broadcast.to(user.room).emit('message', formatMessage(socket.id,botName,`${user.username} has joined the chat`));   //broadcast to everyone but client itself

        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
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
        const clt = getCurrentUser(socket.id);
        const user = getCurrentUser(id);
        const admin = findAdmin(code);

        console.log("user");
        console.log(user);
        console.log("admin is from mongo db password");
        console.log(admin);
        if(user && 'bajaj123'===clt.code){
            userLeave(id);
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
            socket.emit("removeCookies",user);
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