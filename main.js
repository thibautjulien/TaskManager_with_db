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

    console.log('Connected to the database');
});

// Vérifier si la table "tasks" existe
db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='tasks';`, (err, row) => {
    if (err) {
        return console.error(err.message);
    }
    
    if (row) {
        console.log('La table "tasks" existe déjà.');
    } else {
        console.log('La table "tasks" n\'existe pas. Création en cours...');
        
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
            console.log('Table "tasks" créée avec succès.');
        });
    }
});

// Fermer la connection à la db
/* db.close((err) => {
    if (err) {
        return console.error(err.message);
    }

    console.log('Close the database connection');
}); */

function allTasks(callback) {
    db.all(`SELECT id, description, status, created_at, updated_at FROM tasks`, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }

        console.log("========= Tasks List =========");
        if (rows.length === 0) {
            console.log('No task found')
        } else {
            rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.description} - ${row.status} - ${row.created_at} - ${row.updated_at}`);
            });
        }
        console.log("==============================");

        if (callback) {
            callback(rows);
        }
    })
  }
  
  function addTask(description) {
    const sql = `INSERT INTO tasks (description, status) VALUES (?, ?)`;

    db.run(sql, [description, 'à faire'], (err) => {
        if (err) {
            return console.error(err.message);
        }

        console.log('The task has been added to your list !');
    })
  }
  
  function deleteTask(taskIndex) {
    allTasks((rows) => {
        const task = rows[taskIndex - 1];
        if (task) {
            const sql = `DELETE FROM tasks WHERE id = ?`;
            db.run(sql, [task.id], (err) => {
                if (err) {
                    return console.error(err.message);
                }
                console.log('The task has been removed !');
            });
        } else {
            console.log('Task not found !');
        }
    });
  }
  
  function markAsDone(taskIndex) {
    allTasks((rows) => {
        const task = rows[taskIndex - 1];
        if (task) {
            const sql = `UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            db.run(sql, ['réalisée', task.id], (err) => {
                if (err) {
                    return console.error(err.message);
                }
                console.log('The status of the task has been changed : "completed" !');
            });
        } else {
            console.log('Task not found !');
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
    rl.question("Your choice : ", (answer) => {
      if (answer == 1) {
        // see my array allTasks
        if (arrTasks.length === 0) {
          console.log("========= Tasks List =========");
          console.log("This list is empty.");
          console.log("==============================");
          taskManager();
        } else {
          allTasks();
          taskManager();
        }
      } else if (answer == 2) {
        // add a task
        rl.question("add your task : ", (taskName) => {
          if (arrTasks.some((task) => task.name === taskName)) {
            console.log(`"${taskName}" does exist.`);
          } else {
            addTask(taskName);
            console.log(`"${taskName}" was added.`);
          }
          return taskManager();
        });
      } else if (answer == 3) {
        // delete a task
        allTasks();
        rl.question("delete your task : ", (index) => {
          deleteTask(index);
          return taskManager();
        });
      } else if (answer == 4) {
        // mark a task as done
        allTasks();
        rl.question("Mark as done your task : ", (index) => {
          markAsDone(index);
          return taskManager();
        });
      } else if (answer == 5) {
        // exit the task manager
        console.log("You leave the task manager, see you soon!");
        rl.close();
      } else {
        // error 'Invalid choice'
        console.log("Invalid choice");
        rl.close();
      }
    });
  }
  
// taskManager();