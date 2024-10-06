const sqlite3 = require('sqlite3').verbose();
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

// Ouvre la connection à la db
let db = new sqlite3.Database('./tasksmanager.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        return console.error(err.message);
    }

    console.log('[DB-Task-Manager] : Connected to the database');
});

// Vérifier si la table "tasks" existe
db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='tasks';`, (err, row) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('[DB-Task-Manager] : The table already exists. It is loaded.')
    
    if (!row) {
        console.log('Table does not exist. Creation in progress..');
        
        // Créer la table "tasks" si elle n'existe pas
        db.run(`CREATE TABLE tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`, (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log('The table was successfully created');
        });
    }
});

function allTasks(callback) {
    db.all(`SELECT id, description, status, created_at, updated_at FROM tasks`, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }

        console.log("========= Tasks List =========");
        if (rows.length === 0) {
            console.log('No task found');
        } else {
            rows.forEach((row, index) => {
                const statusSymbol = row.status === 'Completed' ? '✔️' : '❗';
                console.log(`#${index + 1} ${row.description}`);
                console.log(`   Status    : ${row.status} ${statusSymbol}`);
                console.log(`   Created at: ${row.created_at}`);
                console.log(`   Updated at: ${row.updated_at}`);
                console.log('----------------------------------');
            });
        }

        if (callback) {
            callback(rows);
        }
    })
  }

  function allTaskSorted() {
    db.all(`SELECT id, description, status, created_at, updated_at FROM tasks ORDER BY status`, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      }

      console.log("========= Tasks List =========");
        if (rows.length === 0) {
            console.log('No task found');
        } else {
            rows.forEach((row, index) => {
                const statusSymbol = row.status === 'Completed' ? '✔️' : '❗';
                console.log(`#${index + 1} ${row.description}`);
                console.log(`   Status    : ${row.status} ${statusSymbol}`);
                console.log(`   Created at: ${row.created_at}`);
                console.log(`   Updated at: ${row.updated_at}`);
                console.log('----------------------------------');
            });
        }
    })
  }
  
  function addTask(description) {
    const sql = `INSERT INTO tasks (description, status) VALUES (?, ?)`;

    db.run(sql, [description, 'ToDo'], (err) => {
        if (err) {
            return console.error(err.message);
        }

        console.log('The task has been added to your list !');
    })
  }
  
  function deleteTask(taskIndex) {
    db.get(`SELECT id FROM tasks LIMIT 1 OFFSET ?`, [taskIndex - 1], (err, row) => {
      if (err) {
          return console.error(err.message);
      }
      if (row) {
          const sql = `DELETE FROM tasks WHERE id = ?`;
          db.run(sql, [row.id], (err) => {
              if (err) {
                  return console.error(err.message);
              }
              console.log('The task has been removed!');
          });
      } else {
          console.log('Task not found!');
      }
    });
  }
  
  function markAsDone(taskIndex) {
    db.get(`SELECT id FROM tasks LIMIT 1 OFFSET ?`, [taskIndex - 1], (err, row) => {
      if (err) {
          return console.error(err.message);
      }
      if (row) {
          const sql = `UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
          db.run(sql, ['Completed', row.id], (err) => {
              if (err) {
                  return console.error(err.message);
              }
              console.log('The status of the task has been changed : "completed" !');
          });
      } else {
          console.log('Task not found!');
      }
    });
  }

  function taskManager() {
    console.log(`==============================`);
    console.log(`-- Welcome to your task manager --
      Press to choose
      1. to see all your tasks
      2. to add a task
      3. to delete a task
      4. to mark a task as done
      5. to Exit the task manager`);
    console.log(`==============================`);
    rl.question(`Press to choose (1-5) : `, (answer) => {
        switch (answer) {
          case '1':
            rl.question('Do you want to display a sorted list ? (yes-no) : ', (answer) => {
              if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                allTaskSorted();
                setTimeout(() => {
                  taskManager();
                }, 2000);
              } else {
                allTasks();
                setTimeout(() => {
                  taskManager();
                }, 2000);
              }
            })
            break;
          case '2':
            allTasks();
            setTimeout(() => {
              rl.question('Add your task : ', (description) => {
                addTask(description);
                setTimeout(() => {
                  taskManager();
                }, 1000);
              })
            }, 1000)
            break;
          case '3':
            allTasks();
            setTimeout(() => {
              rl.question('Delete your task : ', (taskIndex) => {
                deleteTask(taskIndex);
                setTimeout(() => {
                  taskManager();
                }, 1000);
              })
            }, 1000)
            break;
          case '4':
            allTasks();
            setTimeout(() => {
              rl.question('Mark as done your task : ', (taskIndex) => {
                markAsDone(taskIndex);
                setTimeout(() => {
                  taskManager();
                }, 1000);
              })
            }, 1000)
            break;
          case '5':
            // Fermer la connection à la db
            db.close((err) => {
              if (err) {
                  return console.error(err.message);
              }

              console.log('[DB-Task-Manager] : Close the database connection');
            });
            console.log('Goodbye !');
            rl.close();
            break;
          default:
            console.log('Invalid choice !');
            taskManager();
        }
      })
  }

  setTimeout(() => {
    taskManager();
  }, 2000);