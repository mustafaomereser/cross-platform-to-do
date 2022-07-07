class Functions {

    static isset(val = null) {
        return (typeof val !== 'undefined') ? val : null;
    }

    static validator(data, validate) {
        let errors = [];
        for (let index of Object.keys(data)) if (!Functions.isset(data[index])) errors.push(`${index} required!`);
        return { errors: errors, status: (errors.length ? false : true) };
    }

    static str_rand(length = 5) {
        let chars = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuopasdfghjklizxcvbnm0987654321".split(''), rand = '';
        for (let x = 0; length > x; x++) rand += chars[Math.floor(Math.random() * chars.length)];
        return rand;
    }

    static validate_email(email) {
        let re = /\S+@\S+\.\S+/;
        return re.test(email);
    }
}

module.exports = Functions;