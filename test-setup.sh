#!/bin/bash
set -e

echo "🚀 Setting up Manager Rating System..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "📦 Starting PostgreSQL with Docker..."
    
    # Stop existing container if running
    docker stop postgres-manager-rating 2>/dev/null || true
    docker rm postgres-manager-rating 2>/dev/null || true
    
    # Start new container
    docker run --name postgres-manager-rating \
        -e POSTGRES_PASSWORD=password \
        -e POSTGRES_DB=manager_rating_system \
        -p 5432:5432 \
        -d postgres:15
    
    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 5
    
    # Test connection
    until docker exec postgres-manager-rating pg_isready -U postgres; do
        echo "Waiting for PostgreSQL..."
        sleep 2
    done
    
    echo "✅ PostgreSQL is ready!"
else
    echo "❌ Docker not found. Please install Docker or set up PostgreSQL manually."
    echo "See setup.md for instructions."
    exit 1
fi

# Initialize database
echo "🗄️ Initializing database schema..."
npx prisma db push

# Create sample CSV if it doesn't exist
if [ ! -f "List of managers.csv" ]; then
    echo "📝 Creating sample manager data..."
    cat > "List of managers.csv" << EOL
name,position
Олександр Петренко,Менеджер з продажів
Марія Коваленко,Менеджер проєктів
Дмитро Сидоренко,Менеджер з маркетингу
Анна Шевченко,Менеджер HR
Василь Бондаренко,Менеджер розробки
Катерина Мельник,Менеджер фінансів
Іван Кравченко,Менеджер логістики
Ольга Захарченко,Менеджер якості
Сергій Лисенко,Менеджер безпеки
Наталія Руденко,Менеджер клієнтського сервісу
Андрій Павленко,Технічний менеджер
Юлія Гончаренко,Менеджер комунікацій
Михайло Савченко,Менеджер інновацій
Тетяна Височиненко,Менеджер стратегії
Олексій Дорошенко,Менеджер операцій
EOL
    echo "✅ Sample CSV created!"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Import manager data:"
echo "   curl -X POST http://localhost:3000/api/managers/import"
echo ""
echo "2. Start development server:"
echo "   npm run dev"
echo ""
echo "3. Open application:"
echo "   http://localhost:3000"
echo ""
echo "4. View database:"
echo "   npx prisma studio"
echo ""
echo "📚 See setup.md for detailed instructions and troubleshooting."