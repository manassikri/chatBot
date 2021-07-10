const chatBody = document.getElementById('chat-body');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages')
const socket = io();
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
var menue = document.getElementById("contextMenu");
let flg =0;
//Get Username and room from url
// document.getElementById('files').addEventListener('change', handleFileSelect, false);

function startVideoCall(){
    // callFrame = window.DailyIframe.createFrame();
callFrame = window.DailyIframe.createFrame({
    showFullscreenButton: true,
  });
    callFrame.join({ url: 'https://chatbot.daily.co/new-prebuilt-test' });
}

function stopVideoCall(){
    callFrame.leave();
    callFrame.destroy();
}

function GetScreenCordinates(obj) {
    var p = {};
    p.x = obj.offsetLeft;
    p.y = obj.offsetTop;
    while (obj.offsetParent) {
        p.x = p.x + obj.offsetParent.offsetLeft;
        p.y = p.y + obj.offsetParent.offsetTop;
        if (obj == document.getElementsByTagName("body")[0]) {
            break;
        }
        else {
            obj = obj.offsetParent;
        }
    }
    return p;
}
function getPositionXY(id) {
    var txt = document.getElementById(id);
    var pts = GetScreenCordinates(txt);
    return pts;
}


function hideMenu() {
    console.log("im in hide");
    document.getElementById(
        "contextMenu").style.display = "none";
}

// document.onclick=hideMenu;
function displayList(id) {

    const pts = getPositionXY(id);
    console.log("points");
    console.log(pts);
    console.log("SdsdsD", menue.style.display);
    if (menue.style.display === "block"){
        console.log("im going to hide");    
        hideMenu();
    }else{
        console.log("im going to block");
        
        menue.setAttribute("userid",id);
        menue.style.display = 'block';
        menue.style.left = pts.x+2;
        menue.style.top = pts.y+2;
    }

}
function removeFromChat()
{
    console.log("inside removevhat");
    if (menue.style.display == "block"){
        const id = menue.getAttribute("userid");
        console.log("throwing out this id");
        console.log(id);
        socket.emit('throwOut',id);
        hideMenu();
        location.assign('./index.html');
    }
}

const getCookieValue = (name) => (document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '')

socket.emit('joinRoom',{
    username: getCookieValue('username'),
    room: getCookieValue('room'),
    code: getCookieValue('code'),
});

//remove cookie
socket.on('remoceCookies',user=>{
    document.cookie = 'username' +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'room' +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'code' +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
});
//Message from server
socket.on('message',message=>{
    console.log('I will read the message coming from server to print it on front end')
    console.log(message);
    outPutMessage(message);
    // document.getElementById('right').style.backgroundColor = 'green';
    // document.getElementById('left').style.backgroundColor = 'blue';
    //scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});     
// socket.on('cookies',username=>{
//     var cookies=document.cookie
//     .split(';')
//     .map(cookie=>cookie.split('='))
//     .reduce((accumulator,[key,value])=>
//     ({ ...accumulator,[key.trim()]:decodeURIComponent(value)}),
//     {});
//     const val = cookies.username;

//     if(val!==undefined){
//         return 1;
//     }else{
        
//         return 0;
//     }

// });

socket.on('roomUsers',({room,users})=>{
    outPutRoomName(room);
    outPutUsers(users);
});

// menue.addEventListener('click',(e)=>{
//     e.stopPropagation();
// });
//Message Submit
chatForm.addEventListener('submit',(e)=>{

    e.preventDefault(); 

    const msg = e.target.elements.msg.value;  //get message

    // const msg = e.getElementById('msg').value;
    console.log('I can read the message on client side');
    console.log(msg);
    socket.emit('chatMessage',msg); //emitting message to server
    //clear input
    e.target.elements.msg.value ='';
    e.target.elements.msg.value.focus;
});     

//Output message to DOM
function outPutMessage(message){
    console.log("-------------");
    console.log(message);
    console.log("-------------");

    const div = document.createElement('div');


    let algn = "left"

    if(message.username === 'ChatBot'){
        algn="left";
        div.classList.add('left');
    }else if(message.id === socket.id){
        algn = "right";

         div.classList.add('right');

    }else{
        algn="left";
        div.classList.add('left');
    }
    
    div.innerHTML=`<p class ="meta" align ="${algn}">${message.username} <span>${message.time}</span></p>
        <p class="text" align ="${algn}">
            ${message.text}
        </p>`;
    document.querySelector('.chat-messages').appendChild(div);
     
    

}

function outPutRoomName(room){
    roomName.innerText = room;
}
function outPutUsers(users){
    console.log("We are printing users")
    console.log(users);
    userList.innerHTML = `
        ${users.map(user=>`<button class="user_btn user_action_btn" id="${user.id}" data-userid="${user.id}"><li>${user.username}</li></button>`).join('')}
    `;
}

document.addEventListener("click", function(e) {
    console.log(e.target.parentElement)
    if(e.target && e.target.parentElement && e.target.parentElement.classList.contains("user_action_btn")){
        // toggle context menu
        console.log("here")
        displayList(e.target.parentElement.getAttribute("data-userid"));
        e.stopPropagation()

    } else{
        console.log("Im in else");
        hideMenu();
    }
})