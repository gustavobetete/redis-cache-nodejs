import express from 'express'
const app = express()
import { createClient} from "redis";

const client = createClient()

const getAllPducts = async() => {
    const time = Math.random() * 5000
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(['Produto 1', 'Produto 2'])
        }, time)
    })
}

app.get('/saved', async(req, res) => { // exemplo deletando o cache assim que for adicionado ou mudado algo nos dados
    await client.del('getAllPducts')
    res.send({ ok: true})
})

app.get('/', async (req, res) => {
    const productsFromCache = await client.get('getAllPducts')
    if(productsFromCache){
        return res.send(JSON.parse(productsFromCache));
    }
    const products = await getAllPducts()
    // await client.set('getAllPducts', JSON.stringify(products), { EX: 10}) // com expiração ( 10 segundos )
    await client.set('getAllPducts', JSON.stringify(products))
    res.send({products})
})

const startup = async() => {
    await client.connect()
    app.listen(3000, () => {
        console.log('Server running....')
    })
}

startup();
