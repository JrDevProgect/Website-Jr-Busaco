const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataPath = path.join(__dirname, 'data', 'posts.json');

const getPosts = () => {
  const data = fs.readFileSync(dataPath);
  return JSON.parse(data);
};

const savePosts = (posts) => {
  fs.writeFileSync(dataPath, JSON.stringify(posts, null, 2));
};

app.get('/api/posts', (req, res) => {
  const posts = getPosts();
  res.json(posts);
});

app.get('/api/posts/:id', (req, res) => {
  const posts = getPosts();
  const post = posts.find((p) => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

app.post('/api/posts', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const posts = getPosts();
  const newPost = {
    id: Date.now(),
    title,
    content,
    date: new Date().toISOString(),
  };
  posts.push(newPost);
  savePosts(posts);

  res.status(201).json(newPost);
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});