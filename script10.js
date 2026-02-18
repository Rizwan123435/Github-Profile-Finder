class GitHubProfileFinder {
    constructor() {
        this.apiUrl = 'https://api.github.com/users/';
        this.usernameInput = document.getElementById('usernameInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.profileSection = document.getElementById('profileSection');
        this.errorMsg = document.getElementById('errorMsg');
        this.loading = document.getElementById('loading');
        
        this.init();
    }

    init() {
        // Enter key support
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchProfile();
            }
        });

        // Search button
        this.searchBtn.addEventListener('click', () => {
            this.searchProfile();
        });

        // Test on load with famous user
        setTimeout(() => {
            this.usernameInput.value = 'torvalds';
            this.searchProfile();
        }, 1000);
    }

    async searchProfile() {
        const username = this.usernameInput.value.trim();
        
        if (!username) {
            this.showError('Please enter a username');
            return;
        }

        this.showLoading();
        
        try {
            // Add rate limit headers and delay
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const userResponse = await fetch(`${this.apiUrl}${username}`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GitHubProfileFinder/1.0'
                }
            });

            clearTimeout(timeoutId);

            if (!userResponse.ok) {
                if (userResponse.status === 404) {
                    throw new Error('User not found');
                }
                if (userResponse.status === 403) {
                    throw new Error('API rate limit exceeded. Try again later.');
                }
                throw new Error(`HTTP ${userResponse.status}`);
            }

            const userData = await userResponse.json();
            
            // Fetch repos separately
            const reposResponse = await fetch(`${this.apiUrl}${username}/repos?per_page=6&sort=updated`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GitHubProfileFinder/1.0'
                }
            });

            const reposData = await reposResponse.json();

            this.displayProfile(userData, reposData);
            
        } catch (error) {
            console.error('Error:', error);
            let errorMsg = 'Something went wrong!';
            
            if (error.name === 'AbortError') {
                errorMsg = 'Request timeout. Please try again.';
            } else if (error.message.includes('404')) {
                errorMsg = `User "${username}" not found`;
            } else if (error.message.includes('403')) {
                errorMsg = 'Rate limit exceeded. Wait a few minutes or try a different user.';
            }
            
            document.getElementById('errorMsg').innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                ${errorMsg}
                <br><small>Try: torvalds, sindresorhus, facebook</small>
            `;
            this.showError();
        }
    }

    displayProfile(user, repos) {
        // Profile Header
        document.getElementById('profileAvatar').src = user.avatar_url || 'https://via.placeholder.com/120?text=No+Avatar';
        document.getElementById('profileAvatar').alt = user.login;
        document.getElementById('profileName').textContent = user.name || user.login;
        document.getElementById('profileLink').href = user.html_url;
        document.getElementById('profileLink').textContent = `@${user.login}`;
        document.getElementById('profileBio').textContent = user.bio || 'No bio available';

        // Stats
        document.getElementById('publicRepos').textContent = user.public_repos?.toLocaleString() || 0;
        document.getElementById('followers').textContent = user.followers?.toLocaleString() || 0;
        document.getElementById('following').textContent = user.following?.toLocaleString() || 0;

        // Details
        document.getElementById('location').textContent = user.location || 'Not specified';
        document.getElementById('blog').innerHTML = user.blog ? 
            `<a href="${user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}" target="_blank">${user.blog}</a>` : 'Not specified';
        document.getElementById('createdAt').textContent = user.created_at ? 
            new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Unknown';

        // Repositories
        this.displayRepos(repos);

        // Show profile
        this.profileSection.classList.remove('hidden');
        this.errorMsg.classList.add('hidden');
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }

    displayRepos(repos) {
        const reposList = document.getElementById('reposList');
        reposList.innerHTML = '';

        if (!repos || repos.length === 0) {
            reposList.innerHTML = '<div class="repo-item"><p>No public repositories</p></div>';
            return;
        }

        repos.slice(0, 6).forEach(repo => {
            const repoItem = document.createElement('div');
            repoItem.className = 'repo-item';
            repoItem.innerHTML = `
                <div class="repo-name">
                    <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                </div>
                <div class="repo-desc">${repo.description || 'No description'}</div>
                ${repo.language ? `<span class="repo-lang">${repo.language}</span>` : ''}
            `;
            reposList.appendChild(repoItem);
        });
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.profileSection.classList.add('hidden');
        this.errorMsg.classList.add('hidden');
    }

    showError() {
        this.loading.classList.add('hidden');
        this.errorMsg.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GitHubProfileFinder();
});
