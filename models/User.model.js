const bcrypt = require('bcrypt');
const faunadb = require('faunadb')
require('dotenv').config()
const client = new faunadb.Client({secret: process.env.FAUNADB_KEY})

// FQL functions
const {
    Update,
    Delete,
    Ref,
    Paginate,
    Get,
    Match,
    Select,
    Index,
    Create,
    Collection,
    Join,
    Call,
    Function: Fn,
} = faunadb.query;


class User{
    constructor(data){
        this.data = data
    }

    async checkPassword(password){
        try{
            return await bcrypt.compare(password, this.data.data.password)
        }catch(err){
            throw err
        }
    }

    async save(){

        //Hashing the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(this.data['password'], salt)
        this.data['password'] = hashedPassword

        const doc = await client.query(
            Create(
                Collection('users'),
                {data: this.data}
            )
        )
        return doc
    }

    
}

async function findUserByEmail(email){
    const doc = await client.query( Get(Match(Index('users_by_email'), email))).catch((err) => {
        if(!err.description === 'Set not found')
            return null
    })

    return doc
}

async function findUserByRefId(refId) {
    const doc = await client.query( Get(Ref(Collection("users"), refId))).catch((err) => {
        if(!err.description === 'Set not found')
            return null
    })

    return doc
}

async function findUserByUsername(username){
    const doc = await client.query( Get(Match(Index('users_by_username'), username))).catch((err) => {
        if(!err.description === 'Set not found')
            return null
    })

    return doc
}

async function deleteUser(email){
    doc = await findUserByEmail(email);
    client.query(
        Delete(doc.ref)
    )
}

async function updateUser(ref, updatedData) {
    doc = await client.query(Update(ref, {data:updatedData})).catch((err)=>{
        if(!err.description === 'Set not found')
            return null
    })
    return doc
}

module.exports = {User, findUserByEmail, deleteUser, updateUser, findUserByRefId, findUserByUsername}