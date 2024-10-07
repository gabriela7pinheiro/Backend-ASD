import express from 'express';  // Importação de ES Module
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';  // Não precisa usar import dinâmico
import { open } from 'sqlite';

const app = express();
const PORT = 3000;

// Middleware para permitir requisições do frontend
app.use(cors());
app.use(bodyParser.json());

// Função para abrir o banco de dados
async function openDb() {
    return open({
        filename: './banco.db',
        driver: sqlite3.Database, // O driver do banco de dados SQLite
    });
}

app.get('/clinicas', async (req, res) => {
    try {
        const db = await openDb();
        const clinicas = await db.all('SELECT * FROM clinicas;');
        res.status(200).json(clinicas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar clínicas' });
    }
});

// Endpoint para criar uma nova entrada no banco de dados
app.post('/clinicas', async (req, res) => {
    const { nome, email, telefone, especialidades } = req.body;
    
    if (!nome || !email || !telefone || !especialidades) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        const db = await openDb();
        await db.run(`CREATE TABLE IF NOT EXISTS clinicas (id INTEGER PRIMARY KEY, nome TEXT, email TEXT, telefone TEXT, logotipo BLOB, especialidades TEXT, cadastrado INTEGER DEFAULT 0)`);
        
        await db.run(`INSERT INTO clinicas (nome, email, telefone, especialidades, cadastrado) VALUES (?, ?, ?, ?, 0)`, [
            nome,
            email,
            telefone,
            especialidades
        ]);
        
        res.status(201).json({ message: 'Clínica cadastrada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cadastrar clínica' });
    }
});

// Endpoint para atualizar o status da clínica
app.patch('/clinicas/:id', async (req, res) => {
    const { id } = req.params;
    const { cadastrado } = req.body;

    try {
        const db = await openDb();
        
        // Verifica se o novo valor de cadastrado é 1
        if (cadastrado !== 1) {
            return res.status(400).json({ message: 'O valor de cadastrado deve ser 1.' });
        }

        const result = await db.run(`UPDATE clinicas SET cadastrado = ? WHERE id = ?`, [cadastrado, id]);
        
        // Verifica se a clínica foi encontrada e atualizada
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Clínica não encontrada.' });
        }

        res.json({ message: 'Status da clínica atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar status da clínica' });
    }
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
