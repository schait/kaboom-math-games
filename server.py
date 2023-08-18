from flask import Flask, render_template

app = Flask(__name__)


@app.route('/')
def homepage():
    """Show the application's homepage."""

    return render_template("homepage.html")

@app.route('/balance-instructions')
def balance_instructions():
    """Instructions for BalanceItOut game."""

    return render_template('balance_instructions.html')

@app.route('/balance')
def balance_game():
    """BalanceItOut game."""

    return render_template('balance.html')

@app.route('/blaster-instructions')
def blaster_instructions():
    """Instructions for Blaster game."""

    return render_template('blaster_instructions.html')

@app.route('/blaster')
def blaster_game():
    """Equation Blaster game."""

    return render_template('blaster.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0')