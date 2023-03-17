import express from 'express'
const app = express()
import { createClient} from "redis";

const client = createClient()

const getAllPducts = async() => {
    const time = Math.random() * 10000
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
    const productsFromCache = await client.get("getAllPducts")
    const isProductsFromCacheStale = !(await client.get("getAllProducts:validation"))
    if(isProductsFromCacheStale){ // em ambiente de produção precisa por em uma mensageria para ele fazer isso por vc
        const isRefetching = !!(await client.get("getAllPducts:is-refetching"))
        console.log({ isRefetching })
        if(!isRefetching){
            await client.set("getAllPducts:is-refetching", "true", { EX: 20 })
            setTimeout(async() => {
                console.log('Cache is stale - refetching...')
                const products = await getAllPducts()
                await client.set("getAllPducts", JSON.stringify(products));
                await client.set("getAllProducts:validation", "true", { EX: 5 })
                await client.del("getAllPducts:is-refetching");
            }, 0)
        }
    }
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
