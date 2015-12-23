import()
{
    echo "Importing in to db:$1 from dir:setup"
}

if [ -n "$1" ]
then
    import $1
else
    echo "Enter the db name (thanos):"
    read db
    import $db
fi
