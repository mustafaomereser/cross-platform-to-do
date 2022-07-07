const db = require('mysql');
var connection;

class DB {
    static init(res, callback = null) {
        this._table = null;
        this.queries = {
            'select': '*',
            'limit': '',
            'where': [],
            'sets': [],
        };
        this.response = res;
        this._callback = callback;
        return this;
    }

    static db() {
        return connection = db.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'to-do'
        });
    }

    static table(table) {
        this._table = table;
        return this;
    }

    static clear(val = null) {
        if (!val) return;

        let reg = /^-?\d*\.?\d*$/
        if (reg.test(val)) return val;
        val = val.toString();
        if (val.search("'") > -1) return `"${val.replaceAll('"', '\"')}"`;
        else return `'${val.replaceAll("'", "\'")}'`;
    }

    static #privateGetWhere() {
        let where = '';
        this.queries['where'].forEach((item, index) => where += `${item[0]} ${item[1]} ${this.clear(item[2])}${((index + 1) != this.queries['where'].length) ? ` ${item[3]} ` : ''}`);
        return where ? ` WHERE ${where} ` : '';
    }

    static #privateGetSets() {
        let sets = '';
        this.queries['sets'].forEach((item, index) => sets += `${item[0]} = ${this.clear(item[1])}${((index + 1) != this.queries['sets'].length) ? `, ` : ''}`);
        return sets ? ` SET ${sets} ` : '';
    }

    static #privateBuildQuery(type = 'select') {
        let sql = this._table;
        switch (type) {
            case 'select':
                sql = `SELECT ${this.queries['select']} FROM ${sql}`;
                break;

            case 'update':
                sql = `UPDATE ${sql} ${this.#privateGetSets()}`
                break;

            case 'delete':
                sql = `DELETE FROM ${sql}`;
                break;
        }

        sql = `${sql} ${this.#privateGetWhere()} ${this.queries['limit']}`.trim().replaceAll('  ', ' ');
        return sql;
    }

    static execute(type = 'select', select = null, sql = null) {
        sql = (sql ? sql : this.#privateBuildQuery(type));
        let response = this.response, callback = this._callback;

        return this.db().connect(function (err) {
            if (err) throw err;
            connection.query(sql, function (err, results, fields) {
                if (err) throw err;
                connection.end();

                if (select != null) select.split('.').forEach(item => results = results[item]);
                if (!callback) return response.send(results);
                else return callback(results, fields);
            });

            connection.on('error', () => { });
        });
    }

    // Build Query methods: Start
    static where(column, operator, val = null, type = 'AND') {
        if (!val) {
            val = operator;
            operator = '=';
        }
        this.queries['where'].push([column, operator, val, type]);
        return this;
    }

    static limit(start, per = null) {
        this.queries['limit'] = ` LIMIT ${start}${per ? `, ${per}` : ''} `;
        return this;
    }
    // Build Query methods: End

    // Get Methods: Start
    static get() {
        this.execute();
    }

    static first() {
        this.limit(1);
        this.execute('select', '0');
    }
    // Get Methods: End

    // Set Methods: Start
    static update(dict = {}) {
        for (let column of Object.keys(dict)) this.queries['sets'].push([column, dict[column]]);
        this.execute('update');
    }

    static insert(dict = {}) {
        let columns = '', values = '';
        for (let column of Object.keys(dict)) {
            columns += `${column}, `;
            values += `${this.clear(dict[column])}, `;
        }

        this.execute(null, null, `INSERT INTO ${this._table} (${columns.substr(0, columns.length - 2)}) VALUES (${values.substr(0, values.length - 2)})`);
    }
    // Set Methods: End
}

module.exports = DB;
