const users = {};
 
//join users to chat

function userJoin(id,username,room,code){
    const user = {id,username, room, code};
    users[id] = user;

    return user;
}

    
//get current User


function getCurrentUser(id){ 
    return users[id];
}

//User leaves chat
function userLeave(id){
    // const index =  users.findIndex(user => user.id === id);
    // if(index!=-1){
    //     console.log("checking")
    //     // console.log(users.splice(index,1));
    //     return users.splice(index,1)[0];
    // }
    delete users[id];
}

// Get room Users(id)

function getRoomUsers(room){
    return Object.values(users).filter(user =>user.room ===  room);
}
module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
};

