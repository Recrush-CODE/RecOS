let windows = [];
let windowIdCounter = 0;
let draggingWindow = null;
let dragOffset = { x: 0, y: 0 };
let savedPosition = {};
let apps = [];

document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    
    preloadWallpapers();
    
    const savedWallpaper = localStorage.getItem('selectedWallpaper');
    if (savedWallpaper) {
        updateWallpaper(savedWallpaper);
    }

    const menuButton = document.getElementById('menuButton');
    const appMenuOverlay = document.getElementById('appMenuOverlay');
    const appMenuWindow = document.getElementById('appMenuWindow');

    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAppMenu();
    });

    appMenuOverlay.addEventListener('click', (e) => {
        if (e.target === appMenuOverlay) {
            closeAppMenu();
        }
    });

    appMenuWindow.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    initApps();
    restoreMinimizedWindows();

    let rafId = null;
    document.addEventListener('mousemove', (e) => {
        if (draggingWindow && !draggingWindow.classList.contains('maximized')) {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
                const desktop = document.getElementById('desktop');
                const desktopRect = desktop.getBoundingClientRect();
                const newX = e.clientX - desktopRect.left - dragOffset.x;
                const newY = e.clientY - desktopRect.top - dragOffset.y;
                draggingWindow.style.left = `${Math.max(0, newX)}px`;
                draggingWindow.style.top = `${Math.max(0, newY)}px`;
            });
        }
    });

    document.addEventListener('mouseup', () => {
        if (draggingWindow) {
            const win = windows.find(w => w.element === draggingWindow);
            if (win) {
                win.savedLeft = draggingWindow.style.left;
                win.savedTop = draggingWindow.style.top;
            }
            draggingWindow = null;
        }
    });
});

function initApps() {
    apps = [
        { id: 'explorer', name: 'Explorer', icon: '🗂️' },
        { id: 'settings', name: 'Settings', icon: '⚙️' },
        { id: 'terminal', name: 'Terminal', icon: '💻' },
        { id: 'notepad', name: 'Notepad', icon: '📄' }
    ];

    const appMenuGrid = document.getElementById('appMenuGrid');
    
    apps.forEach(app => {
        const appItem = document.createElement('div');
        appItem.className = 'app-menu-item';
        appItem.dataset.appId = app.id;
        
        appItem.innerHTML = `
            <div class="app-menu-item-icon">${app.icon}</div>
            <div class="app-menu-item-label">${app.name}</div>
        `;

        appItem.addEventListener('click', (e) => {
            e.stopPropagation();
            openApp(app.id);
            closeAppMenu();
        });

        appMenuGrid.appendChild(appItem);
    });
}

function openApp(appId) {
    if (appId === 'settings') {
        openSettings();
    } else if (appId === 'terminal') {
        openTerminal();
    } else if (appId === 'notepad') {
        openNotepad();
    } else if (appId === 'explorer') {
        openExplorer();
    }
}

function openSettings(immediatelyMinimize = false) {
    const windowId = `window-${windowIdCounter++}`;
    const window = document.createElement('div');
    window.className = 'window settings-window';
    window.id = windowId;
    window.style.left = '200px';
    window.style.top = '100px';
    if (immediatelyMinimize) {
        window.style.display = 'none';
    }

    const header = document.createElement('div');
    header.className = 'window-header';

    const controls = document.createElement('div');
    controls.className = 'window-controls';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'window-control close';
    closeBtn.onclick = () => closeWindow(windowId);

    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'window-control minimize';
    minimizeBtn.onclick = () => minimizeWindow(windowId);

    const maximizeBtn = document.createElement('button');
    maximizeBtn.className = 'window-control maximize';
    maximizeBtn.onclick = () => maximizeWindow(windowId);

    controls.appendChild(closeBtn);
    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);
    header.appendChild(controls);

    const content = document.createElement('div');
    content.className = 'window-content settings-content';

    const tabs = document.createElement('div');
    tabs.className = 'settings-tabs';
    
    const infoTab = document.createElement('button');
    infoTab.className = 'settings-tab active';
    infoTab.textContent = 'Info';
    infoTab.onclick = () => switchSettingsTab('info', windowId);
    
    const wallpaperTab = document.createElement('button');
    wallpaperTab.className = 'settings-tab';
    wallpaperTab.textContent = 'Wallpaper';
    wallpaperTab.onclick = () => switchSettingsTab('wallpaper', windowId);
    
    tabs.appendChild(infoTab);
    tabs.appendChild(wallpaperTab);
    content.appendChild(tabs);

    const tabContent = document.createElement('div');
    tabContent.className = 'settings-tab-content';
    tabContent.id = `settings-tab-content-${windowId}`;

    const selectedWallpaper = localStorage.getItem('selectedWallpaper') || 'wallpapers/wallpaper_1.jpg';

    const infoContent = document.createElement('div');
    infoContent.className = 'settings-tab-pane active';
    infoContent.id = `settings-info-${windowId}`;
    infoContent.innerHTML = `
        <div class="about-content">
            <div class="about-icon" style="background-image: url('${selectedWallpaper}')"></div>
            <div class="about-info">
                <div class="about-title">RecOS</div>
                <div class="about-version">
                    <span class="version-number">Version 1.0.0</span>
                    <span class="version-build">(Release)</span>
                </div>
                <div class="about-specs">
                    <div class="spec-item">Operating System - RecOS</div>
                    <div class="spec-item">Processor - Web (RE5-10150U)</div>
                    <div class="spec-item">Memory - Web (32GB)</div>
                </div>
            </div>
        </div>
    `;

    const wallpaperContent = document.createElement('div');
    wallpaperContent.className = 'settings-tab-pane';
    wallpaperContent.id = `settings-wallpaper-${windowId}`;
    
    const wallpaperGrid = document.createElement('div');
    wallpaperGrid.className = 'wallpaper-grid';
    
    const wallpapers = [
        { name: 'Wallpaper 1', path: 'wallpapers/wallpaper_1.jpg' },
        { name: 'Wallpaper 2', path: 'wallpapers/wallpaper_2.jpg' },
        { name: 'Wallpaper 3', path: 'wallpapers/wallpaper_3.jpg' }
    ];
    
    wallpapers.forEach(wp => {
        const wallpaperItem = document.createElement('div');
        wallpaperItem.className = 'wallpaper-item';
        if (selectedWallpaper === wp.path) {
            wallpaperItem.classList.add('selected');
        }
        
        const wallpaperCircle = document.createElement('div');
        wallpaperCircle.className = 'wallpaper-circle';
        
        const img = new Image();
        img.onload = () => {
            wallpaperCircle.style.backgroundImage = `url('${wp.path}')`;
        };
        img.src = wp.path;
        
        const wallpaperName = document.createElement('div');
        wallpaperName.className = 'wallpaper-name';
        wallpaperName.textContent = wp.name;
        
        wallpaperItem.appendChild(wallpaperCircle);
        wallpaperItem.appendChild(wallpaperName);
        
        wallpaperItem.onclick = () => {
            localStorage.setItem('selectedWallpaper', wp.path);
            document.querySelectorAll(`#settings-wallpaper-${windowId} .wallpaper-item`).forEach(item => {
                item.classList.remove('selected');
            });
            wallpaperItem.classList.add('selected');
            updateWallpaper(wp.path);
            const aboutIcon = document.querySelector(`#settings-info-${windowId} .about-icon`);
            if (aboutIcon) {
                aboutIcon.style.backgroundImage = `url('${wp.path}')`;
            }
        };
        
        wallpaperGrid.appendChild(wallpaperItem);
    });
    
    wallpaperContent.appendChild(wallpaperGrid);
    
    tabContent.appendChild(infoContent);
    tabContent.appendChild(wallpaperContent);
    content.appendChild(tabContent);
    window.appendChild(header);
    window.appendChild(content);

    document.getElementById('desktop').appendChild(window);
    windows.push({ id: windowId, element: window, maximized: false, savedLeft: '200px', savedTop: '100px' });
    focusWindow(windowId);

    header.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.window-control')) {
            if (window.classList.contains('maximized')) {
                return;
            }
            draggingWindow = window;
            const rect = window.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            focusWindow(windowId);
            e.preventDefault();
            e.stopPropagation();
        }
    });

    window.addEventListener('click', () => {
        focusWindow(windowId);
    });
    
    return windowId;
}

function switchSettingsTab(tab, windowId) {
    const tabs = document.querySelectorAll(`#${windowId} .settings-tab`);
    const panes = document.querySelectorAll(`#settings-tab-content-${windowId} .settings-tab-pane`);
    
    tabs.forEach(t => t.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));
    
    if (tab === 'info') {
        tabs[0].classList.add('active');
        document.getElementById(`settings-info-${windowId}`).classList.add('active');
    } else if (tab === 'wallpaper') {
        tabs[1].classList.add('active');
        document.getElementById(`settings-wallpaper-${windowId}`).classList.add('active');
    }
}

function preloadWallpapers() {
    const wallpapers = [
        'wallpapers/wallpaper_1.jpg',
        'wallpapers/wallpaper_2.jpg',
        'wallpapers/wallpaper_3.jpg'
    ];
    
    wallpapers.forEach(path => {
        const img = new Image();
        img.src = path;
    });
}

function updateWallpaper(wallpaperPath) {
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.style.backgroundImage = `url('${wallpaperPath}')`;
    }
}

function openTerminal(immediatelyMinimize = false) {
    const windowId = `window-${windowIdCounter++}`;
    const window = document.createElement('div');
    window.className = 'window terminal-window';
    window.id = windowId;
    window.style.left = '250px';
    window.style.top = '150px';
    if (immediatelyMinimize) {
        window.style.display = 'none';
    }

    const header = document.createElement('div');
    header.className = 'window-header';

    const controls = document.createElement('div');
    controls.className = 'window-controls';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'window-control close';
    closeBtn.onclick = () => closeWindow(windowId);

    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'window-control minimize';
    minimizeBtn.onclick = () => minimizeWindow(windowId);

    const maximizeBtn = document.createElement('button');
    maximizeBtn.className = 'window-control maximize';
    maximizeBtn.onclick = () => maximizeWindow(windowId);

    controls.appendChild(closeBtn);
    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);
    header.appendChild(controls);

    const content = document.createElement('div');
    content.className = 'window-content terminal-content';

    const terminalOutput = document.createElement('div');
    terminalOutput.className = 'terminal-output';
    terminalOutput.id = `terminal-output-${windowId}`;

    content.appendChild(terminalOutput);

    const inputContainer = document.createElement('div');
    inputContainer.className = 'terminal-input-container';
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = '$';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'terminal-input-field';
    input.placeholder = '';
    inputContainer.appendChild(prompt);
    inputContainer.appendChild(input);
    content.appendChild(inputContainer);

    window.appendChild(header);
    window.appendChild(content);

    document.getElementById('desktop').appendChild(window);
    windows.push({ id: windowId, element: window, maximized: false, savedLeft: '250px', savedTop: '150px' });
    focusWindow(windowId);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value.trim();
            if (command) {
                executeCommand(command, terminalOutput, windowId);
            }
            input.value = '';
        }
    });

    header.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.window-control')) {
            if (window.classList.contains('maximized')) {
                return;
            }
            draggingWindow = window;
            const rect = window.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            focusWindow(windowId);
            e.preventDefault();
            e.stopPropagation();
        }
    });

    window.addEventListener('click', () => {
        focusWindow(windowId);
        input.focus();
    });

    setTimeout(() => input.focus(), 100);
    
    return windowId;
}

function openNotepad(immediatelyMinimize = false) {
    const windowId = `window-${windowIdCounter++}`;
    const window = document.createElement('div');
    window.className = 'window notepad-window';
    window.id = windowId;
    window.style.left = '300px';
    window.style.top = '120px';
    if (immediatelyMinimize) {
        window.style.display = 'none';
    }

    const header = document.createElement('div');
    header.className = 'window-header';

    const controls = document.createElement('div');
    controls.className = 'window-controls';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'window-control close';
    closeBtn.onclick = () => closeWindow(windowId);

    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'window-control minimize';
    minimizeBtn.onclick = () => minimizeWindow(windowId);

    const maximizeBtn = document.createElement('button');
    maximizeBtn.className = 'window-control maximize';
    maximizeBtn.onclick = () => maximizeWindow(windowId);

    controls.appendChild(closeBtn);
    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);
    header.appendChild(controls);

    const content = document.createElement('div');
    content.className = 'window-content notepad-content';

    const textarea = document.createElement('textarea');
    textarea.className = 'notepad-textarea';
    textarea.id = `notepad-${windowId}`;
    textarea.placeholder = 'Start typing...';
    
    const savedText = localStorage.getItem('notepad-content');
    if (savedText) {
        textarea.value = savedText;
    }

    textarea.addEventListener('input', () => {
        localStorage.setItem('notepad-content', textarea.value);
    });

    content.appendChild(textarea);
    window.appendChild(header);
    window.appendChild(content);

    document.getElementById('desktop').appendChild(window);
    windows.push({ id: windowId, element: window, maximized: false, savedLeft: '300px', savedTop: '120px' });
    focusWindow(windowId);

    header.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.window-control')) {
            if (window.classList.contains('maximized')) {
                return;
            }
            draggingWindow = window;
            const rect = window.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            focusWindow(windowId);
            e.preventDefault();
            e.stopPropagation();
        }
    });

    window.addEventListener('click', () => {
        focusWindow(windowId);
    });

    setTimeout(() => textarea.focus(), 100);
    
    return windowId;
}

function openExplorer(immediatelyMinimize = false) {
    const windowId = `window-${windowIdCounter++}`;
    const window = document.createElement('div');
    window.className = 'window explorer-window';
    window.id = windowId;
    window.style.left = '350px';
    window.style.top = '100px';
    if (immediatelyMinimize) {
        window.style.display = 'none';
    }

    const header = document.createElement('div');
    header.className = 'window-header';

    const controls = document.createElement('div');
    controls.className = 'window-controls';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'window-control close';
    closeBtn.onclick = () => closeWindow(windowId);

    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'window-control minimize';
    minimizeBtn.onclick = () => minimizeWindow(windowId);

    const maximizeBtn = document.createElement('button');
    maximizeBtn.className = 'window-control maximize';
    maximizeBtn.onclick = () => maximizeWindow(windowId);

    controls.appendChild(closeBtn);
    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);
    header.appendChild(controls);

    const content = document.createElement('div');
    content.className = 'window-content explorer-content';

    const pathBar = document.createElement('div');
    pathBar.className = 'explorer-path';
    pathBar.textContent = '/home';

    const fileList = document.createElement('div');
    fileList.className = 'explorer-list';
    fileList.id = `explorer-list-${windowId}`;

    let currentPath = '/home';
    const appsList = [
        { name: 'Explorer.app', size: '3 589 КБ', id: 'explorer', sizeValue: 3589 },
        { name: 'Settings.app', size: '574 КБ', id: 'settings', sizeValue: 574 },
        { name: 'Terminal.app', size: '901 КБ', id: 'terminal', sizeValue: 901 },
        { name: 'Notepad.app', size: '254 КБ', id: 'notepad', sizeValue: 254 }
    ].sort((a, b) => b.sizeValue - a.sizeValue);
    
    const fileSystem = {
        '/home': ['user', 'system', 'apps'],
        '/home/user': [
            { name: 'Desktop.os', size: '8 789 КБ', type: 'file', sizeValue: 8789 },
            { name: 'User_data.os', size: '4 КБ', type: 'file', sizeValue: 4 }
        ],
        '/home/system': [
            { name: 'Core.os', size: '32 871 КБ', type: 'file', sizeValue: 32871 }
        ],
        '/home/apps': appsList.map(app => ({ ...app, type: 'app' }))
    };

    function updateFileList(path) {
        fileList.innerHTML = '';
        pathBar.textContent = path;
        currentPath = path;

        if (path === '/home/apps') {
            if (path !== '/home') {
                const backItem = document.createElement('div');
                backItem.className = 'explorer-item';
                backItem.innerHTML = '<span class="explorer-icon">⬅️</span><span class="explorer-name">..</span>';
                backItem.onclick = () => {
                    const parentPath = path.split('/').slice(0, -1).join('/') || '/home';
                    updateFileList(parentPath);
                };
                fileList.appendChild(backItem);
            }

            appsList.forEach(app => {
                const itemElement = document.createElement('div');
                itemElement.className = 'explorer-item explorer-app-item';
                itemElement.innerHTML = `
                    <span class="explorer-icon">🧩</span>
                    <span class="explorer-name">${app.name}</span>
                    <span class="explorer-size">${app.size}</span>
                `;
                fileList.appendChild(itemElement);
            });
            return;
        }

        const items = fileSystem[path] || [];
        
        if (path !== '/home') {
            const backItem = document.createElement('div');
            backItem.className = 'explorer-item';
            backItem.innerHTML = '<span class="explorer-icon">⬅️</span><span class="explorer-name">..</span>';
            backItem.onclick = () => {
                const parentPath = path.split('/').slice(0, -1).join('/') || '/home';
                updateFileList(parentPath);
            };
            fileList.appendChild(backItem);
        }

        const folders = [];
        const files = [];

        items.forEach(item => {
            if (typeof item === 'string') {
                folders.push({ name: item, type: 'folder' });
            } else if (item.type === 'file') {
                files.push(item);
            } else if (item.type === 'folder') {
                folders.push(item);
            }
        });

        folders.sort((a, b) => a.name.localeCompare(b.name));
        files.sort((a, b) => b.sizeValue - a.sizeValue);

        folders.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'explorer-item';
            itemElement.innerHTML = `<span class="explorer-icon">📁</span><span class="explorer-name">${item.name || item}</span>`;
            itemElement.onclick = () => {
                const itemName = item.name || item;
                const newPath = path === '/home' ? `/home/${itemName}` : `${path}/${itemName}`;
                if (fileSystem[newPath] !== undefined) {
                    updateFileList(newPath);
                }
            };
            fileList.appendChild(itemElement);
        });

        files.forEach(file => {
            const itemElement = document.createElement('div');
            itemElement.className = 'explorer-item explorer-file-item';
            itemElement.innerHTML = `
                <span class="explorer-icon">🧩</span>
                <span class="explorer-name">${file.name}</span>
                <span class="explorer-size">${file.size}</span>
            `;
            fileList.appendChild(itemElement);
        });
    }

    content.appendChild(pathBar);
    content.appendChild(fileList);
    window.appendChild(header);
    window.appendChild(content);

    document.getElementById('desktop').appendChild(window);
    windows.push({ id: windowId, element: window, maximized: false, savedLeft: '350px', savedTop: '100px' });
    focusWindow(windowId);

    updateFileList('/home');

    header.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.window-control')) {
            if (window.classList.contains('maximized')) {
                return;
            }
            draggingWindow = window;
            const rect = window.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            focusWindow(windowId);
            e.preventDefault();
            e.stopPropagation();
        }
    });

    window.addEventListener('click', () => {
        focusWindow(windowId);
    });
    
    return windowId;
}

function executeCommand(command, output, windowId) {
    const commandLine = document.createElement('div');
    commandLine.className = 'terminal-line';
    commandLine.innerHTML = `<span class="terminal-prompt">$</span> ${command}`;
    output.appendChild(commandLine);

    const cmd = command.trim();

    if (cmd === 'clear' || cmd === 'Clear' || cmd === 'CLEAR') {
        output.innerHTML = '';
        output.scrollTop = 0;
        return;
    }

    if (cmd === 'exit' || cmd === 'Exit' || cmd === 'EXIT') {
        closeWindow(windowId);
        return;
    }

    if (cmd === 'shutdown' || cmd === 'Shutdown' || cmd === 'SHUTDOWN') {
        window.close();
        return;
    }

    if (cmd === 'reboot' || cmd === 'Reboot' || cmd === 'REBOOT') {
        location.reload();
        return;
    }

    const response = document.createElement('div');
    response.className = 'terminal-line';

    if (cmd === 'date' || cmd === 'Date' || cmd === 'DATE') {
        response.textContent = new Date().toString();
    } else if (cmd === 'pwd' || cmd === 'Pwd' || cmd === 'PWD') {
        response.textContent = '/home/user';
    } else if (cmd === 'help' || cmd === 'Help' || cmd === 'HELP') {
        response.textContent = 'Available commands: clear, exit, shutdown, reboot, date, pwd, help';
    } else {
        response.textContent = `Command not found: ${command}`;
    }

    output.appendChild(response);
    output.scrollTop = output.scrollHeight;
}

function focusWindow(windowId) {
    windows.forEach(w => {
        if (w.id === windowId) {
            w.element.classList.add('active');
        } else {
            w.element.classList.remove('active');
        }
    });
}

function closeWindow(windowId) {
    const window = windows.find(w => w.id === windowId);
    if (window) {
        window.element.classList.add('closing');
        setTimeout(() => {
            window.element.remove();
            windows = windows.filter(w => w.id !== windowId);
            removeFromTaskbar(windowId);
        }, 300);
    }
}

function minimizeWindow(windowId) {
    const taskbarApps = document.getElementById('taskbarApps');
    const currentApps = taskbarApps.querySelectorAll('.taskbar-app-icon');
    if (currentApps.length >= 15) {
        return;
    }
    
    const window = windows.find(w => w.id === windowId);
    if (window) {
        window.element.classList.add('minimizing');
        setTimeout(() => {
            window.minimized = true;
            window.element.style.display = 'none';
            window.element.classList.remove('minimizing');
            addToTaskbar(windowId, window);
            saveMinimizedWindows();
        }, 300);
    }
}

function saveMinimizedWindows() {
    const minimizedTypes = new Set();
    windows.forEach(w => {
        if (w.minimized) {
            let appType = 'unknown';
            if (w.element.classList.contains('settings-window')) {
                appType = 'settings';
            } else if (w.element.classList.contains('terminal-window')) {
                appType = 'terminal';
            } else if (w.element.classList.contains('notepad-window')) {
                appType = 'notepad';
            } else if (w.element.classList.contains('explorer-window')) {
                appType = 'explorer';
            }
            if (appType !== 'unknown') {
                minimizedTypes.add(appType);
            }
        }
    });
    localStorage.setItem('minimizedWindows', JSON.stringify(Array.from(minimizedTypes)));
}

function restoreMinimizedWindows() {
    const saved = localStorage.getItem('minimizedWindows');
    if (!saved) return;
    
    try {
        const minimizedTypes = JSON.parse(saved);
        minimizedTypes.forEach(appType => {
            const hasOpenWindow = windows.some(w => {
                if (appType === 'settings' && w.element.classList.contains('settings-window')) return true;
                if (appType === 'terminal' && w.element.classList.contains('terminal-window')) return true;
                if (appType === 'notepad' && w.element.classList.contains('notepad-window')) return true;
                if (appType === 'explorer' && w.element.classList.contains('explorer-window')) return true;
                return false;
            });
            
            if (!hasOpenWindow) {
                let newWindowId;
                if (appType === 'settings') {
                    newWindowId = openSettings(true);
                } else if (appType === 'terminal') {
                    newWindowId = openTerminal(true);
                } else if (appType === 'notepad') {
                    newWindowId = openNotepad(true);
                } else if (appType === 'explorer') {
                    newWindowId = openExplorer(true);
                }
                
                if (newWindowId) {
                    const newWindow = windows.find(w => w.id === newWindowId);
                    if (newWindow) {
                        newWindow.minimized = true;
                        newWindow.element.style.display = 'none';
                        addToTaskbar(newWindowId, newWindow);
                    }
                }
            }
        });
    } catch (e) {
        console.error('Error restoring minimized windows:', e);
    }
}

function addToTaskbar(windowId, window) {
    const taskbarApps = document.getElementById('taskbarApps');
    const existingIcon = taskbarApps.querySelector(`[data-window-id="${windowId}"]`);
    if (existingIcon) {
        return;
    }

    const currentApps = taskbarApps.querySelectorAll('.taskbar-app-icon');
    if (currentApps.length >= 15) {
        return;
    }

    const appIcon = document.createElement('div');
    appIcon.className = 'taskbar-app-icon';
    appIcon.dataset.windowId = windowId;
    
    let icon = '▢';
    if (window.element.classList.contains('settings-window')) {
        icon = '⚙️';
    } else if (window.element.classList.contains('terminal-window')) {
        icon = '💻';
    } else if (window.element.classList.contains('notepad-window')) {
        icon = '📄';
    } else if (window.element.classList.contains('explorer-window')) {
        icon = '🗂️';
    }
    
    appIcon.textContent = icon;
    appIcon.onclick = () => {
        restoreWindow(windowId);
    };

    taskbarApps.appendChild(appIcon);
}

function restoreWindow(windowId) {
    const window = windows.find(w => w.id === windowId);
    if (window) {
        window.minimized = false;
        window.element.style.display = 'flex';
        focusWindow(windowId);
        removeFromTaskbar(windowId);
        saveMinimizedWindows();
    }
}

function removeFromTaskbar(windowId) {
    const taskbarApps = document.getElementById('taskbarApps');
    const icon = taskbarApps.querySelector(`[data-window-id="${windowId}"]`);
    if (icon) {
        icon.remove();
    }
    saveMinimizedWindows();
}

function maximizeWindow(windowId) {
    const window = windows.find(w => w.id === windowId);
    if (window) {
        window.maximized = !window.maximized;
        if (window.maximized) {
            window.savedLeft = window.element.style.left;
            window.savedTop = window.element.style.top;
            window.element.classList.add('maximized');
        } else {
            window.element.classList.remove('maximized');
            window.element.style.left = window.savedLeft;
            window.element.style.top = window.savedTop;
        }
    }
}

function toggleAppMenu() {
    const appMenuOverlay = document.getElementById('appMenuOverlay');
    appMenuOverlay.classList.toggle('active');
}

function closeAppMenu() {
    const appMenuOverlay = document.getElementById('appMenuOverlay');
    appMenuOverlay.classList.remove('active');
}

function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('timeDisplay').textContent = `${hours}:${minutes}`;
}

