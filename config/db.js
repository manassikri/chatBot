const {MongoClient} = require('mongodb');

async function main() {
	
    const uri = "mongodb+srv://manassikri04:Panda0408@cluster0.sshov.mongodb.net/participantList?retryWrites=true&w=majority";

    const client = new MongoClient(uri,{ 
        useNewUrlParser: true,  
        useUnifiedTopology: true 
    });
    try {
        await client.connect();
    
        // await listDatabases();
     
    } catch (e) {
        
        console.error(e);
        throw e;
    }
    return client;
}

// async function getDbName{
//     return databasesList.databases.forEach(db => console.log(` - ${db.name}`));
// }
const client = main();

async function listDatabases(){
    const databasesList = await (await client).db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
    // console.log(databasesList.databases.find(db => db.name === "participantList"));
};
listDatabases();
async function findDatabase(){

    console.log('###############################');
    const databasesList = await (await client).db().admin().listDatabases();
    return databasesList.databases.find(db => db.name === "participantList");
};

module.exports = {client,findDatabase}; 



