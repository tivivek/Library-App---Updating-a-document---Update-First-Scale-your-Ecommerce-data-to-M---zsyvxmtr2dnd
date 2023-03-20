const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 8080;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const connection = require("./connector");
const cors = require('cors');
app.use(cors());



app.get('/api/books/:id', async (req, res) => {
  const { id: unformatted_id } = req.params;
  const id = Number(unformatted_id);
  if (Number.isNaN(id) || id < 1)
    return res.status(400).json({
      message: "Book id is invalid",
    });

  await connection.query(`SELECT title, description, genre, author, rating, review, FavQuotes, section FROM Books WHERE id = ${id};`, (err, result) => {
    if (err) { res.status(400).json({ error: "Invalid Arguments" }); }
    if (result.length == 0) {
      res.status(404).send()
    } else
      res.json({
        data: result,
        message: "Successfully fetched a Book",
      });
  })
});

app.get('/api/books', (req, res) => {
  connection.query('SELECT * FROM Books ORDER BY id ASC;', (err, result) => {
    if (err) { res.status(400).json(err.message); }
    res.status(200).json({
      data: result,
      message: "Successfully fetched all Books",
    });
  })
});

app.post('/api/books', async (req, res) => {
  const { title, description, genre, author, rating, review, FavQuotes, section } = req.body;

  connection.query("INSERT INTO Books (title, description, genre, author, rating, review, FavQuotes, section) VALUES (?,?,?,?,?,?,?,?);", [title, description, genre, author, rating, review, FavQuotes, section], (err, result, fields) => {
    if (err) { res.status(400).json({ error: "invalid arguments" }); }
    else {
      res.status(201).json({ message: "Successfully added a book", id: result.insertId });
    }
  });
});

app.patch('/api/books/:id', async (req, res) => {

  const { id: unformatted_id } = req.params;
  const { title, description, genre, author, rating, review, FavQuotes, section } = req.body;
  const id = Number(unformatted_id); //Validation
  if (Number.isNaN(id) || id < 1)
    return res.status(400).json({
      message: "Book id is invalid",
    });

  connection.query(
    `UPDATE Books SET ${[title ? ('title="' + title + '" ') : "", description ? ('description="' + description + '" ') : "", genre ? ('genre="' + genre + '" ') : "", author ? ('author="' + author + '" ') : "", rating ? ('rating=' + rating + ' ') : "", review ? ('review="' + review + '" ') : "", FavQuotes ? ('FavQuotes="' + FavQuotes + '" ') : "", section ? ('section="' + section + '" ') : ""].filter(e => e !== "").join(',')}  WHERE id = ${id}`,
    (err, result, fields) => {

      if (err) {
        res.status(400).json(err.message);
        console.log(err)
      } else if (result['changedRows'] == 1) {
        res.status(204).json({ message: "Successfully updated a Book" });
      } else
        res.status(404).send()
    });
});

app.delete('/api/books/:id', async (req, res) => {
  const { id: unformatted_id } = req.params;
  const id = Number(unformatted_id);

  await connection.query(`DELETE FROM Books WHERE id = ${id}; `, (err, result) => {
    if (err) { res.status(400).json(err.message); }
    const { affectedRows } = result;
    if (affectedRows === 0)
      return res.status(404).json({
        message: "Book id is invalid or does not exist",
      });
    else
      res.status(204).json({
        message: "Successfully deleted a Book",
      });
  })
})


app.patch('/api/users/:name', async (req, res) => {
  let name = req.params.name
  let details = req.body
  connection.query('update user set toRead="' + details.toRead.join(',') + '" , isRead="' + details.isRead.join(',') + '" where id="' + name + '";', (err, result) => {
    if (err) { res.status(400).send() }
    else if (+result.changedRows === 1) {
      return res.status(204).send()
    }
    else {
      return res.status(404).send()
    }
  })
})


app.get('/api/users', async (req, res) => {
  connection.query(`SELECT isRead, toRead FROM user where id = "${req.query.name}"; `, (err, result) => {
    if (err) { res.status(400).json(err.message); return console.log(err) }
    if (result.length == 0) {
      return connection.query('insert into user (id,toRead,isRead) values("' + req.query.name + '","","");', (err, result) => {
        if (err) {
          console.log(err)

          res.status(400).json({ message: "failed to create account" });
        }
        else {
          res.status(201).send({ name: req.query.name, isRead: [], toRead: [] })
        }
      })
    }
    else {
      console.log(result)
      res.status(200).json({ name: req.query.name, isRead: result[0].isRead.split(','), toRead: result[0].toRead.split(',') })
    }
  })
});

app.use('/', (req, res) => {
  res.send({ message: "noSuchAPI" })
})
app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Server listening on ${port} `)
});

module.exports = app;
