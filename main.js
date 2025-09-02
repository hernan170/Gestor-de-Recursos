document.addEventListener('DOMContentLoaded', () => {

    // --- DATOS INICIALES (Simulación para Herramientas, etc.) ---
    let technicians = ["Juan Pérez", "María García", "Carlos López", "Ana Martínez"];
    let tools = [
        { id: 1, name: "Taladro Percutor", totalStock: 10, assigned: [] },
        { id: 2, name: "Amoladora Angular", totalStock: 8, assigned: [] },
        { id: 3, name: "Juego de Destornilladores", totalStock: 15, assigned: [] },
    ];
    let apparel = [
        { id: 1, name: "Camisa de Trabajo", type: "Superior", stock: 30, assigned: [] },
        { id: 2, name: "Pantalón de Grafa", type: "Inferior", stock: 25, assigned: [] },
        { id: 3, name: "Botines de Seguridad", type: "Calzado", stock: 40, assigned: [] },
    ];
    let vehicles = [
        { id: 1, name: "Ford Ranger (AA123BC)", services: [{ date: "01/08/2025", technician: "Juan Pérez", description: "Cambio de aceite y filtros" }], materials: [{ date: "01/08/2025", technician: "Juan Pérez", description: "Juego de balizas" }] },
        { id: 2, name: "Renault Kangoo (AD456FE)", services: [{ date: "15/07/2025", technician: "María García", description: "Revisión de frenos" }], materials: [{ date: "15/07/2025", technician: "María García", description: "Rueda de auxilio en buen estado" }] },
    ];

    // --- SELECTORES DEL DOM ---
    const sections = document.querySelectorAll('.content-section');
    const navButtons = document.querySelectorAll('nav button');
    // Herramientas
    const toolsTableBody = document.getElementById('toolsTableBody');
    const toolSelect = document.getElementById('toolSelect');
    const toolTechnicianSelect = document.getElementById('toolTechnicianSelect');
    const assignToolForm = document.getElementById('assignToolForm');
    // Vehículos
    const vehicleList = document.getElementById('vehicleList');
    const addVehicleForm = document.getElementById('addVehicleForm');
    // Indumentaria
    const apparelTableBody = document.getElementById('apparelTableBody');
    const apparelSelect = document.getElementById('apparelSelect');
    const apparelTechnicianSelect = document.getElementById('apparelTechnicianSelect');
    const assignApparelForm = document.getElementById('assignApparelForm');
    // Notificaciones
    const notificationForm = document.getElementById('notificationForm');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationList = document.getElementById('notificationList');

    // ** Lógica de Firebase integrada y corregida **
    const db = firebase.firestore();
    const notificationsCollection = db.collection('notifications');

    // --- LÓGICA DE NAVEGACIÓN ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            sections.forEach(section => section.classList.remove('active'));
            navButtons.forEach(btn => btn.classList.remove('active'));
            const targetId = button.id.replace('btn', '').toLowerCase();
            document.getElementById(targetId).classList.add('active');
            button.classList.add('active');
        });
    });

    // --- GESTIÓN DE HERRAMIENTAS, VEHÍCULOS E INDUMENTARIA (Lógica Local) ---
    function renderTools() {
        toolsTableBody.innerHTML = '';
        tools.forEach(tool => {
            const assignedQty = tool.assigned.reduce((sum, item) => sum + item.quantity, 0);
            const availableStock = tool.totalStock - assignedQty;
            const assignedText = tool.assigned.map(a => `${a.technician} (${a.quantity})`).join(', ') || 'N/A';
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${tool.name}</td>
                <td>${tool.totalStock}</td>
                <td>${availableStock}</td>
                <td>${assignedText}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${tool.id}" data-type="tools"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete-btn" data-id="${tool.id}" data-type="tools"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            toolsTableBody.appendChild(row);
        });
        populateToolSelect();
    }

    function renderVehicles() {
        vehicleList.innerHTML = '';
        vehicles.forEach(vehicle => {
            const card = document.createElement('div');
            card.className = 'vehicle-card';
            
            // Renderiza el historial de servicios
            let servicesHTML = '<ul>' + vehicle.services.map(s => `<li>**${s.date}** - ${s.description} (Técnico: ${s.technician})</li>`).join('') + '</ul>';
            // Renderiza el historial de materiales
            let materialsHTML = '<ul>' + vehicle.materials.map(m => `<li>**${m.date}** - ${m.description} (Técnico: ${m.technician})</li>`).join('') + '</ul>';
            
            card.innerHTML = `
                <h3>${vehicle.name}</h3>
                <div><strong>Historial de Services:</strong>${servicesHTML}</div>
                <div><strong>Historial de Materiales:</strong>${materialsHTML}</div>
                <div class="form-grid vehicle-action-form">
                    <input type="text" placeholder="Nuevo service..." data-input-type="service" data-id="${vehicle.id}" />
                    <select class="technician-select" data-id="${vehicle.id}" data-type="service"></select>
                    <button class="primary-btn" data-action="addService" data-id="${vehicle.id}">Agregar</button>
                </div>
                <div class="form-grid vehicle-action-form">
                    <input type="text" placeholder="Nuevo material..." data-input-type="material" data-id="${vehicle.id}" />
                    <select class="technician-select" data-id="${vehicle.id}" data-type="material"></select>
                    <button class="primary-btn" data-action="addMaterial" data-id="${vehicle.id}">Agregar</button>
                </div>
                <div class="vehicle-actions">
                    <button class="action-btn edit-btn" data-id="${vehicle.id}" data-type="vehicles"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete-btn" data-id="${vehicle.id}" data-type="vehicles"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            vehicleList.appendChild(card);
        });
         // Llena los select de técnicos para la sección de vehículos
        populateTechnicianSelects(document.querySelectorAll('#vehicleList .technician-select'));
    }

    function renderApparel() {
        apparelTableBody.innerHTML = '';
        apparel.forEach(item => {
            const assignedCount = item.assigned.length;
            const availableStock = item.stock - assignedCount;
            const assignedText = item.assigned.join(', ') || 'N/A';
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${availableStock}</td>
                <td>${assignedText} (${assignedCount})</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${item.id}" data-type="apparel"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete-btn" data-id="${item.id}" data-type="apparel"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            apparelTableBody.appendChild(row);
        });
        populateApparelSelect();
    }
    
    // Función para llenar los select de técnicos. Ahora puede recibir un NodeList de selectores.
    function populateTechnicianSelects(selects = [toolTechnicianSelect, apparelTechnicianSelect]) { 
        selects.forEach(select => {
            select.innerHTML = '';
            technicians.forEach(tech => select.add(new Option(tech, tech)));
        });
    }

    function populateToolSelect() { toolSelect.innerHTML = ''; tools.forEach(tool => { const available = tool.totalStock - tool.assigned.reduce((s, i) => s + i.quantity, 0); if (available > 0) toolSelect.add(new Option(`${tool.name} (Disp: ${available})`, tool.id)); }); }
    function populateApparelSelect() { apparelSelect.innerHTML = ''; apparel.forEach(item => { const available = item.stock - item.assigned.length; if (available > 0) apparelSelect.add(new Option(`${item.name} (Disp: ${available})`, item.id)); }); }

    // Manejadores de formularios... (Sin cambios mayores, solo alertas de SweetAlert)
    assignToolForm.addEventListener('submit', e => {
        e.preventDefault();
        const tool = tools.find(t => t.id === +toolSelect.value);
        const qty = +document.getElementById('toolQuantity').value;
        const tech = toolTechnicianSelect.value;
        const available = tool.totalStock - tool.assigned.reduce((s, i) => s + i.quantity, 0);
        
        if (qty > available) {
            Swal.fire({ icon: 'warning', title: 'Stock insuficiente', text: 'La cantidad solicitada supera el stock disponible.' });
            return;
        }
        
        const assignment = tool.assigned.find(a => a.technician === tech);
        if (assignment) {
            assignment.quantity += qty;
        } else {
            tool.assigned.push({ technician: tech, quantity: qty });
        }
        
        Swal.fire({ icon: 'success', title: 'Herramienta asignada', text: `Se asignaron ${qty} unidades de ${tool.name} a ${tech}.` });
        renderTools();
        assignToolForm.reset();
    });

    addVehicleForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('vehicleName').value.trim();
        if(name) {
            vehicles.push({ id: Date.now(), name, services: [], materials: [] });
            Swal.fire({ icon: 'success', title: 'Vehículo agregado', text: `El vehículo "${name}" ha sido agregado.` });
            renderVehicles();
            addVehicleForm.reset();
        }
    });

    assignApparelForm.addEventListener('submit', e => {
        e.preventDefault();
        const item = apparel.find(a => a.id === +apparelSelect.value);
        const tech = apparelTechnicianSelect.value;
        if (item.stock - item.assigned.length <= 0) {
            Swal.fire({ icon: 'warning', title: 'Stock agotado', text: 'No hay stock disponible de esta indumentaria.' });
            return;
        }
        item.assigned.push(tech);
        Swal.fire({ icon: 'success', title: 'Indumentaria asignada', text: `Se asignó una unidad de ${item.name} a ${tech}.` });
        renderApparel();
        assignApparelForm.reset();
    });

    vehicleList.addEventListener('click', e => {
        if (e.target.tagName !== 'BUTTON') return;
        const { action, id } = e.target.dataset;
        const vehicle = vehicles.find(v => v.id === +id);
        const input = document.querySelector(`input[data-id="${id}"][data-input-type="${action.replace('add', '').toLowerCase()}"]`);
        const technicianSelect = document.querySelector(`select[data-id="${id}"][data-type="${action.replace('add', '').toLowerCase()}"]`);
        
        const text = input.value.trim();
        const technician = technicianSelect.value;

        if (text && vehicle) {
            const date = new Date().toLocaleDateString('es-AR');
            const newEntry = { date, technician, description: text };

            if (action === 'addService') {
                vehicle.services.push(newEntry);
                Swal.fire({ icon: 'success', title: 'Service agregado', text: `El service "${text}" ha sido agregado.` });
            } else if (action === 'addMaterial') {
                vehicle.materials.push(newEntry);
                Swal.fire({ icon: 'success', title: 'Material agregado', text: `El material "${text}" ha sido agregado.` });
            }
            input.value = '';
            renderVehicles();
        }
    });

    // --- LÓGICA DE NOTIFICACIONES (Conectada a Firebase) ---
    notificationForm.addEventListener('submit', e => {
        e.preventDefault();
        const message = notificationMessage.value.trim();
        if (message) {
            notificationsCollection.add({
                message: message,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                Swal.fire({ icon: 'success', title: 'Notificación enviada', text: 'El mensaje ha sido publicado correctamente.' });
                notificationForm.reset();
            }).catch(err => {
                Swal.fire({ icon: 'error', title: 'Error al enviar', text: `Hubo un problema al enviar la notificación: ${err.message}` });
                console.error("Error:", err);
            });
        }
    });

    notificationsCollection.orderBy('createdAt', 'desc').limit(20).onSnapshot(snapshot => {
        notificationList.innerHTML = '';
        snapshot.forEach(doc => {
            const notification = doc.data();
            const card = document.createElement('div');
            card.className = 'notification-card';
            const date = notification.createdAt ? notification.createdAt.toDate().toLocaleString('es-AR') : 'Enviando...';
            card.innerHTML = `<p>${notification.message}</p><span>${date}</span>`;
            notificationList.appendChild(card);
        });
    });

    // --- MANEJADORES DE EVENTOS PARA EDITAR Y ELIMINAR (Generales) ---
    document.addEventListener('click', e => {
        if (e.target.closest('.delete-btn')) {
            const btn = e.target.closest('.delete-btn');
            const id = +btn.dataset.id;
            const type = btn.dataset.type;
            
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'No podrás revertir esta acción.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    switch (type) {
                        case 'tools':
                            tools = tools.filter(item => item.id !== id);
                            renderTools();
                            break;
                        case 'vehicles':
                            vehicles = vehicles.filter(item => item.id !== id);
                            renderVehicles();
                            break;
                        case 'apparel':
                            apparel = apparel.filter(item => item.id !== id);
                            renderApparel();
                            break;
                    }
                    Swal.fire( '¡Eliminado!', 'El elemento ha sido eliminado.', 'success' );
                }
            });
        }

        if (e.target.closest('.edit-btn')) {
            const btn = e.target.closest('.edit-btn');
            const id = +btn.dataset.id;
            const type = btn.dataset.type;
            
            Swal.fire({
                icon: 'info',
                title: 'Funcionalidad en desarrollo',
                text: `La opción de edición para la sección de ${type} y el ítem con ID ${id} aún no está implementada.`
            });
        }
    });

    // --- LÓGICA DEL CHECKLIST DE VEHÍCULOS ---
    document.querySelector('.checklist-section').addEventListener('click', e => {
        const item = e.target.closest('.checklist-item');
        if (!item) return;

        const dateInput = item.querySelector('.item-fecha');
        const timeInput = item.querySelector('.item-hora');
        const itemName = item.querySelector('.item-nombre').textContent.trim();
        
        // Selector para el nuevo contenedor de historial
        const historyContainer = document.getElementById('checklist-history-container');
        
        // Asignar un ID único al item del checklist para sincronizarlo con el historial
        const uniqueId = item.getAttribute('data-id') || `item-${Date.now()}`;
        item.setAttribute('data-id', uniqueId);

        if (e.target.classList.contains('btn-aplicar')) {
            const fecha = dateInput.value;
            const hora = timeInput.value;

            if (fecha && hora) {
                // Eliminar tarjeta anterior si existe (para evitar duplicados al editar)
                const existingCard = historyContainer.querySelector(`[data-id="${uniqueId}"]`);
                if (existingCard) {
                    existingCard.remove();
                }

                // Genera el HTML para el historial y lo agrega al contenedor
                const historyCard = document.createElement('div');
                historyCard.className = 'history-card';
                historyCard.setAttribute('data-id', uniqueId); // Sincroniza con el ítem del checklist
                historyCard.innerHTML = `
                    <h4>${itemName}</h4>
                    <p><strong>Fecha:</strong> ${fecha}</p>
                    <p><strong>Hora:</strong> ${hora}</p>
                `;
                historyContainer.prepend(historyCard); // Agrega la nueva tarjeta al principio

                Swal.fire({
                    icon: 'success',
                    title: 'Evento guardado',
                    text: `Se guardó el evento para "${itemName}" el día ${fecha} a las ${hora}.`
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: 'Por favor, selecciona una fecha y una hora.'
                });
            }
        }

        if (e.target.classList.contains('btn-editar')) {
            // Activar/desactivar los campos de entrada para edición
            const isEditing = dateInput.hasAttribute('readonly');
            if (isEditing) {
                dateInput.removeAttribute('readonly');
                timeInput.removeAttribute('readonly');
                e.target.textContent = 'Guardar';
            } else {
                dateInput.setAttribute('readonly', 'true');
                timeInput.setAttribute('readonly', 'true');
                e.target.textContent = 'Editar';
            }
            Swal.fire({
                icon: 'info',
                title: 'Modo de edición',
                text: 'Ahora puedes editar la fecha y hora.'
            });
        }

        if (e.target.classList.contains('btn-eliminar')) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esto eliminará el evento del checklist.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    const historyCard = historyContainer.querySelector(`[data-id="${uniqueId}"]`);
                    if (historyCard) {
                        historyCard.remove(); // Elimina la tarjeta del historial
                    }
                    item.remove(); // Elimina el elemento de la lista del DOM
                    Swal.fire( '¡Eliminado!', `El evento de "${itemName}" ha sido eliminado.`, 'success' );
                }
            });
        }
    });

    // --- INICIALIZACIÓN ---
    function initialize() {
        renderTools();
        renderVehicles();
        renderApparel();
        populateTechnicianSelects();
    }
    initialize();
});