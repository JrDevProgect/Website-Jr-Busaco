
document.addEventListener('DOMContentLoaded', () => {
  const postForm = document.getElementById('postForm');
  const postsContainer = document.getElementById('posts');
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');

  const createLoadingSpinner = () => {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
        <defs>
          <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="spinner-gradient">
            <stop stop-color="currentColor" stop-opacity="0" offset="0%"/>
            <stop stop-color="currentColor" stop-opacity=".631" offset="63.146%"/>
            <stop stop-color="currentColor" offset="100%"/>
          </linearGradient>
        </defs>
        <g fill="none" fill-rule="evenodd">
          <g transform="translate(1 1)">
            <path d="M36 18c0-9.94-8.06-18-18-18" stroke="url(#spinner-gradient)" stroke-width="3">
              <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="0.9s" repeatCount="indefinite"/>
            </path>
          </g>
        </g>
      </svg>
    `;
    return spinner;
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const loadPosts = async () => {
    try {
      postsContainer.innerHTML = '';
      postsContainer.appendChild(createLoadingSpinner());

      const response = await fetch('/api/posts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const posts = await response.json();

      postsContainer.innerHTML = '';
      
      if (posts.length === 0) {
        postsContainer.innerHTML = `
          <div class="no-posts">
            <p>No posts yet. Be the first to share your thoughts!</p>
          </div>
        `;
        return;
      }

      posts.forEach((post, index) => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        postElement.style.setProperty('--index', index);
        
        postElement.innerHTML = `
          <div class="post-card-content">
            <time class="post-date">${formatDate(post.date)}</time>
            <h2>${post.title}</h2>
            <p>${truncateText(post.content, 150)}</p>
            <a href="/post.html?id=${post.id}" class="read-more">Read more</a>
          </div>
        `;
        
        postsContainer.appendChild(postElement);
        
        setTimeout(() => {
          postElement.style.opacity = '1';
          postElement.style.transform = 'translateY(0)';
        }, 50);
      });
    } catch (error) {
      console.error('Error loading posts:', error);
      postsContainer.innerHTML = `
        <div class="error-message">
          <p>Failed to load posts. Please try again later.</p>
          <button class="btn-retry">Retry</button>
        </div>
      `;
      
      document.querySelector('.btn-retry')?.addEventListener('click', loadPosts);
    }
  };

  const loadPost = async () => {
    const postTitle = document.getElementById('postTitle');
    const postContent = document.getElementById('postContent');
    const postDate = document.getElementById('postDate');
    const singlePost = document.querySelector('.single-post');
    
    if (!postTitle || !postContent || !postDate) return;
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get('id');

      if (!postId) {
        window.location.href = '/';
        return;
      }
      
      singlePost.classList.add('loading');
      postTitle.innerHTML = '<div class="skeleton-loader title-loader"></div>';
      postContent.innerHTML = `
        <div class="skeleton-loader content-loader"></div>
        <div class="skeleton-loader content-loader"></div>
        <div class="skeleton-loader content-loader"></div>
      `;
      postDate.innerHTML = '<div class="skeleton-loader date-loader"></div>';

      const response = await fetch(`/api/posts/${postId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      
      const post = await response.json();

      setTimeout(() => {
        singlePost.classList.remove('loading');
        postTitle.textContent = post.title;
        postContent.textContent = post.content;
        postDate.textContent = formatDate(post.date);
        
        document.title = `${post.title} | Thoughtscape`;
      }, 300);
    } catch (error) {
      console.error('Error loading post:', error);
      singlePost.innerHTML = `
        <div class="error-message">
          <h2>Post not found</h2>
          <p>The post you're looking for doesn't exist or has been removed.</p>
          <a href="/" class="btn-submit">Back to Home</a>
        </div>
      `;
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    if (!titleInput.value.trim()) {
      titleInput.classList.add('error');
      isValid = false;
    } else {
      titleInput.classList.remove('error');
    }
    
    if (!contentInput.value.trim()) {
      contentInput.classList.add('error');
      isValid = false;
    } else {
      contentInput.classList.remove('error');
    }
    
    return isValid;
  };

  if (contentInput) {
    const formGroup = contentInput.closest('.form-group');
    const charCounter = document.createElement('div');
    charCounter.className = 'char-counter';
    charCounter.textContent = '0 characters';
    formGroup.appendChild(charCounter);
    
    contentInput.addEventListener('input', () => {
      const count = contentInput.value.length;
      charCounter.textContent = `${count} character${count !== 1 ? 's' : ''}`;
      
      if (count > 500) {
        charCounter.classList.add('long-post');
      } else {
        charCounter.classList.remove('long-post');
      }
    });
  }

  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        showNotification('Please fill in all fields', 'error');
        return;
      }
      
      const title = titleInput.value;
      const content = contentInput.value;
      
      const submitButton = postForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg class="spinner" viewBox="0 0 50 50">
          <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
        </svg>
        <span>Publishing...</span>
      `;

      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        });

        if (!response.ok) {
          throw new Error('Failed to create post');
        }

        postForm.reset();
        showNotification('Post published successfully!');
        
        document.querySelector('.char-counter').textContent = '0 characters';
        
        setTimeout(loadPosts, 300);
      } catch (error) {
        console.error('Error creating post:', error);
        showNotification('Failed to publish post. Please try again.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    });

    loadPosts();
  } else {
    loadPost();
  }

  const style = document.createElement('style');
  style.textContent = `
    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: var(--primary-color);
    }
    
    .notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background-color: var(--card-bg);
      color: var(--text-color);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px var(--shadow);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 1000;
      border-left: 4px solid var(--primary-color);
    }
    
    .notification.show {
      transform: translateY(0);
      opacity: 1;
    }
    
    .notification.error {
      border-left-color: #e53e3e;
    }
    
    .notification.success {
      border-left-color: #38a169;
    }
    
    .error-message {
      text-align: center;
      padding: 40px 20px;
    }
    
    .btn-retry {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: var(--radius-md);
      cursor: pointer;
      margin-top: 16px;
    }
    
    .no-posts {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
    }
    
    .char-counter {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-align: right;
      margin-top: 4px;
      transition: all 0.2s ease;
    }
    
    .char-counter.long-post {
      color: var(--primary-color);
      font-weight: 500;
    }
    
    input.error, textarea.error {
      border-color: #e53e3e;
    }
    
    .skeleton-loader {
      background: linear-gradient(90deg, var(--card-bg) 25%, var(--border-color) 50%, var(--card-bg) 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: var(--radius-sm);
    }
    
    .title-loader {
      height: 40px;
      margin-bottom: 16px;
    }
    
    .date-loader {
      height: 20px;
      width: 150px;
    }
    
    .content-loader {
      height: 20px;
      margin-bottom: 12px;
    }
    
    .content-loader:last-child {
      width: 70%;
    }
    
    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
    
    .spinner {
      animation: rotate 2s linear infinite;
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }
    
    .spinner .path {
      stroke: white;
      stroke-linecap: round;
      animation: dash 1.5s ease-in-out infinite;
    }
    
    @keyframes rotate {
      100% {
        transform: rotate(360deg);
      }
    }
    
    @keyframes dash {
      0% {
        stroke-dasharray: 1, 150;
        stroke-dashoffset: 0;
      }
      50% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -35;
      }
      100% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -124;
      }
    }
  `;
  document.head.appendChild(style);
});