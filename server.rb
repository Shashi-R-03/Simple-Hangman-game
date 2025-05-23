require 'sinatra'
require 'json'
require 'securerandom'

# Serve static files and set public folder
set :public_folder, 'public'
enable :static

# In-memory sessions
SESSIONS = {}

# Load words with hints
WORDS = File.readlines('words.txt').map do |line|
  word, hint = line.strip.split('|')
  { word: word.downcase, hint: hint }
end

# Serve the frontend
get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

# Start a new game
post '/new' do
  content_type :json
  choice = WORDS.sample
  id = SecureRandom.uuid
  SESSIONS[id] = {
    word: choice[:word],
    hint: choice[:hint],
    guesses: [],
    lives: 6,
    status: 'ongoing'
  }
  {
    session: id,
    hint: choice[:hint],
    display: '_' * choice[:word].length,
    lives: 6,
    status: 'ongoing'
  }.to_json
end

# Handle a guess
post '/guess' do
  content_type :json
  data = JSON.parse(request.body.read)
  game = SESSIONS[data['session']]
  halt 404, { error: 'Game not found' }.to_json unless game

  letter = data['letter'].downcase
  unless game[:guesses].include?(letter)
    game[:guesses] << letter
    game[:lives] -= 1 unless game[:word].include?(letter)
  end

  # Build display
  display = game[:word].chars.map { |c| game[:guesses].include?(c) ? c : '_' }.join

  # Update status
  if display == game[:word]
    game[:status] = 'win'
  elsif game[:lives] <= 0
    game[:status] = 'lose'
    display = game[:word]  # reveal on loss
  end

  { display: display, lives: game[:lives], status: game[:status] }.to_json
end