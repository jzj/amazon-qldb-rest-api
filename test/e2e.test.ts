const APIGW_ENDPOINT= process.env.APIGW_ENDPOINT;
const request = require('supertest')(APIGW_ENDPOINT);
const _ = require('lodash');
const util = require('util');

const templateInvoice = {
    "key": "TO_BE_FILLED",
    "value": {
        "date": "2021-05-22",
        "billTo": "ABC Car Dealer Pte Ltd",
        "paymentStatus": "PENDING",
        "carInfo": {
            "model": "Honda",
            "make": "Jazz",
            "year": 2021,
            "unitPrice": 89000
        },
        "quantity": 10
    }
}

describe('Insert new invoice', () => {
    it('can insert 1 invoice', async () => {
        const invoiceNo = 'TEST10001';
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray[0].key = invoiceNo;

        const result = await request
                                .post('/')
                                .send(dataArray)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(typeof res).toEqual('object');
        expect(res).toHaveProperty('documentId');
        expect(res).toHaveProperty('txId');
    });

    it('can insert 2 invoices', async () => {
        const invoice1No = 'TEST10011';
        const invoice2No = 'TEST10012';
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray[0].key = invoice1No;
        dataArray[1].key = invoice2No;

        const result = await request
                                .post('/')
                                .send(dataArray)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(Array.isArray(res)).toBe(true);
        res.forEach((r: Object) => {
            expect(r).toHaveProperty('documentId');
            expect(r).toHaveProperty('txId');
        });
    });

    it('cannot insert 0 invoice', async () => {
        const result = await request
                                .post('/')
                                .send([])
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });
    
    it('cannot insert more than 10 invoices', async () => {
        let dataArray = [];
        for (let i = 0; i < 11; i++) {
            const invoiceNo = `TEST1002${i}`;
            dataArray.push(_.cloneDeep(templateInvoice));
            dataArray[i].key = invoiceNo;
        }
        const result = await request
                                .post('/')
                                .send(dataArray)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });

    it('cannot insert invoice with improper format', async () => {
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        const invoiceNo = 'TEST10031';
        dataArray[0].key = invoiceNo;
        delete dataArray[0].value.billTo;

        const result = await request
                                .post('/')
                                .send(dataArray)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');

    });

    it('cannot insert invoices with duplicate keys', async () => {
        const invoice1No = 'TEST10041';
        const invoice2No = 'TEST10041';
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray[0].key = invoice1No;
        dataArray[1].key = invoice2No;

        const result = await request
                                .post('/')
                                .send(dataArray)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Duplicate key');
    });
});

describe('Retrieve invoices', () => {
    it('can retrieve 1 invoice', async () => {
        const result = await request
                                .get('/')
                                .query({
                                    keys: 'TEST10001'
                                })
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(typeof res).toEqual('object');
        expect(res).toHaveProperty('quantity');
        expect(res).toHaveProperty('date');
        expect(res).toHaveProperty('billTo');
        expect(res).toHaveProperty('carInfo');
    });

    it('can retrieve multiple invoices', async () => {
        const result = await request
                                .get('/')
                                .query({
                                    keys: 'TEST10001,TEST10012'
                                })
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toEqual(2);
        res.forEach((r: Object) => {
            expect(r).toHaveProperty('quantity');
            expect(r).toHaveProperty('date');
            expect(r).toHaveProperty('billTo');
            expect(r).toHaveProperty('carInfo');
        });
    });

    it('cannot retrieve more than 32 invoices at the same time', async () => {
        const result = await request
                                .get('/')
                                .query({
                                    keys: 'TEST10001,TEST10012,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF,AG'
                                })
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Requested records do not exist');

    });

    it('cannot retrieve invoices that do not exist', async () => {
        const result = await request
                                .get('/')
                                .query({
                                    keys: 'A,B'
                                })
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Requested records do not exist');
    });

    it('cannot retrieve invoices without "keys" query string', async () => {
        const result = await request
                                .get('/')
                                .query({
                                    key: 'TEST10001'
                                })
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});

describe('Get invoice receipt by key', () => {
    it('can get 1 invoice receipt by key', async () => {
        const result = await request
                                .get('/receipt-by-key')
                                .query({
                                    key: 'TEST10001'
                                });
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(typeof res).toEqual('object');
        expect(res).toHaveProperty('LedgerName');
        expect(res).toHaveProperty('TableName');
        expect(res).toHaveProperty('BlockAddress');
        expect(res).toHaveProperty('DocumentId');
        expect(res).toHaveProperty('RevisionHash');
        expect(res).toHaveProperty('Proof');
    });

    it('cannot get invoice receipt for key that does not exist', async () => {
        const result = await request
                                .get('/receipt-by-key')
                                .query({
                                    key: 'XYZ'
                                });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get metadata');
    });

    it('cannot retrieve receipt without "key" query string', async () => {
        const result = await request
                                .get('/receipt-by-key')
                                .query({
                                    some_other_key: 'TEST10001'
                                })
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});

describe('Get invoice receipt by docId and txId', () => {
    it('can get 1 invoice receipt by docId and txId', async () => {

        const invoiceNo = 'TEST40001';
        let dataArray = [];
        dataArray.push(_.cloneDeep(templateInvoice));
        dataArray[0].key = invoiceNo;

        const info = await request
                                .post('/')
                                .send(dataArray)
                                .set('Content-Type', 'application/json');
        
        expect(info.statusCode).toEqual(200);
        const docId = info.body.documentId;
        const txId = info.body.txId;

        const result = await request
                                .get('/receipt-by-doc')
                                .query({
                                    docId: docId,
                                    txId: txId
                                });
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(typeof res).toEqual('object');
        expect(res).toHaveProperty('LedgerName');
        expect(res).toHaveProperty('TableName');
        expect(res).toHaveProperty('BlockAddress');
        expect(res).toHaveProperty('DocumentId');
        expect(res).toHaveProperty('RevisionHash');
        expect(res).toHaveProperty('Proof');
    });

    it('cannot get invoice receipt for docId and/or txId that do not exist', async () => {
        const result = await request
                                .get('/receipt-by-doc')
                                .query({
                                    docId: 'ABC',
                                    txId: 'XYZ'
                                });
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get metadata');
    });

    it('cannot retrieve receipt without "docId" and/or "txId" query string', async () => {
        const result = await request
                                .get('/receipt-by-doc')
                                .query({
                                    some_other_key: 'TEST10001'
                                })
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});

describe('Verify invoice receipt', () => {
    let receipt = {};

    beforeAll(async () => {
        const res = await request.get('/receipt-by-key')
        .query({
           key: 'TEST10001'
        });
        expect(res.statusCode).toEqual(200);
        receipt = res.body;
    });

    it('can verify 1 invoice receipt', async () => {
        
        const res = await request
                                .post('/verify')
                                .send(_.cloneDeep(receipt))
                                .set('Content-Type', 'application/json');
        expect(res.statusCode).toEqual(200);
        const result = res.body;
        expect(typeof result).toEqual('object');
        expect(result).toHaveProperty('result');
    });

    it('cannot verify invoice receipt with improper format', async () => {
        const result = await request
                                .post('/verify')
                                .send({})
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });

    it('cannot verify invoice receipt with incorrect block address', async () => {
        const m = _.cloneDeep(receipt);

        m.BlockAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 3}"

        const result = await request
                                .post('/verify')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadata');
    });

    it('cannot verify invoice receipt with incorrect documentId', async () => {
        const m = _.cloneDeep(receipt);

        m.DocumentId = 'abcdefghijklmnopqstuvw';

        const result = await request
                                .post('/verify')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadata');
    });

    it('cannot verify invoice receipt with incorrect documentId length (not 22 characters)', async () => {
        const m = _.cloneDeep(receipt);

        m.DocumentId = 'XYZ';

        const result = await request
                                .post('/verify')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });

    it('cannot verify invoice receipt with incorrect revision hash', async () => {
        const m = _.cloneDeep(receipt);

        m.RevisionHash = 'abcdefghijklmnopqstuvw';

        const result = await request
                                .post('/verify')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadata');
    });

    it('cannot verify invoice receipt with incorrect ledger digest', async () => {
        const m = _.cloneDeep(receipt);

        m.LedgerDigest.Digest = 'abcdefghijklmnopqstuvw';

        const result = await request
                                .post('/verify')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadata');
    });

    it('cannot verify invoice receipt with incorrect digest tip address', async () => {
        const m = _.cloneDeep(receipt);

        m.LedgerDigest.DigestTipAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 8}"

        const result = await request
                                .post('/verify')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not verify the metadata');
    });

});

describe('Get document revision by receipt', () => {
    let receipt = {};

    beforeAll(async () => {
        const res = await request.get('/receipt-by-key')
        .query({
           key: 'TEST10001'
        });
        expect(res.statusCode).toEqual(200);
        receipt = res.body;
    });

    it('can retrieve 1 document revision by receipt', async () => {
        
        const res = await request
                                .post('/revision')
                                .send(_.cloneDeep(receipt))
                                .set('Content-Type', 'application/json');
        expect(res.statusCode).toEqual(200);
        const result = res.body;
        expect(typeof result).toEqual('object');
        expect(result).toHaveProperty('Proof');
        expect(result).toHaveProperty('Revision');
    });

    it('cannot retrieve document revision with improper format', async () => {
        const result = await request
                                .post('/revision')
                                .send({})
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });

    it('cannot retrieve document revision with incorrect block address', async () => {
        const m = _.cloneDeep(receipt);

        m.BlockAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 3}"

        const result = await request
                                .post('/revision')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get document revision');
    });

    it('cannot retrieve document revision with incorrect documentId', async () => {
        const m = _.cloneDeep(receipt);

        m.DocumentId = 'abcdefghijklmnopqstuvw';

        const result = await request
                                .post('/revision')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get document revision');
    });

    it('cannot retrieve document revision with incorrect documentId length (not 22 characters)', async () => {
        const m = _.cloneDeep(receipt);

        m.DocumentId = 'XYZ';

        const result = await request
                                .post('/revision')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Invalid request body');
    });

    it('cannot retrieve document revision with incorrect digest tip address', async () => {
        const m = _.cloneDeep(receipt);

        m.LedgerDigest.DigestTipAddress.IonText = "{strandId: \"abcdefghijklmnopqstuvw\", sequenceNo: 8}"

        const result = await request
                                .post('/revision')
                                .send(m)
                                .set('Content-Type', 'application/json');
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get document revision');
    });

});

describe('Retrieve invoice history', () => {
    it('can retrieve 1 invoice history', async () => {
        const result = await request
                                .get('/history')
                                .query({
                                    key: 'TEST10001'
                                })
        expect(result.statusCode).toEqual(200);
        const res = result.body;
        expect(Array.isArray(res)).toBe(true);
        res.forEach((r: Object) => {
            expect(r).toHaveProperty('blockAddress');
            expect(r).toHaveProperty('hash');
            expect(r).toHaveProperty('data');
            expect(r).toHaveProperty('metadata');
        });
    });

    it('cannot retrieve history for invoice that do not exist', async () => {
        const result = await request
                                .get('/history')
                                .query({
                                    key: 'A'
                                })
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Could not get history');
    });

    it('cannot retrieve invoices without "key" query string', async () => {
        const result = await request
                                .get('/history')
                                .query({
                                    keys: 'TEST10001'
                                })
        expect(result.statusCode).toEqual(400);
        const res = result.body;
        expect(res).toHaveProperty('message');
        expect(res.message).toContain('Missing required request parameters');
    });
});