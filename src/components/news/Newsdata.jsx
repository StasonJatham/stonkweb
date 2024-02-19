import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from "@material-tailwind/react";
import Chart from 'react-apexcharts';

const stopWords = [
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
    'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
    'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because',
    'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
    'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', 'couldn', 'didn',
    'doesn', 'hadn', 'hasn', 'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn',
    'wasn', 'weren', 'won', 'wouldn', '2023', '2024', 'null', 'shares'
];

const filterBadSymbols = (text) => {
    return text.replace(/<\/?[^>]+(>|$)/g, "").replace(/[\/"()',&;:/.\[\]{}-]/g, "");
};
const includesKeyword = (article, keyword) => {
    const titleLower = article.title.toLowerCase();
    const summaryLower = article.summary ? article.summary.toLowerCase() : "";
    return titleLower.includes(keyword) || summaryLower.includes(keyword);
};

export default function Newsdata() {
    const [articles, setArticles] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [wordCounts, setWordCounts] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("https://api.stonkmarket.de/api/v1/news/articles/?limit=50");
                setArticles(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

        const intervalId = setInterval(() => {
            fetchData();
            console.log("Grabbing some new News.")
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const countWords = () => {
            const counts = {};
            articles.forEach(article => {
                const allText = article.title.toLowerCase() + " " + (article.tags && article.tags.toLowerCase()) + " " + (article.summary && article.summary.toLowerCase())
                const words = filterBadSymbols(allText).split(/\s+/);
                const uniqueWords = new Set(words.filter(word => !stopWords.includes(word)));
                uniqueWords.forEach(word => {
                    counts[word] = (counts[word] || 0) + 1;
                });
            });

            // Filter out words with count less than 2
            const filteredCounts = Object.fromEntries(
                Object.entries(counts).filter(([word, count]) => count >= 3)
            );

            setWordCounts(filteredCounts);
        };

        countWords();
    }, [articles]);

    const filteredArticles = articles.filter(article => includesKeyword(article, searchKeyword.toLowerCase()));

    const options = {
        chart: {
            type: 'bar'
        },
        xaxis: {
            categories: Object.keys(wordCounts),
        }
    };

    const series = [{
        name: 'Hits',
        data: Object.values(wordCounts)
    }];

    const handleSearch = (e) => {
        setSearchKeyword(e.target.value)
    };

    return (
        <>
            <div className="m-6">
                <Chart options={options} series={series} type="bar" height={350} />
            </div>
            <div className='m-6'>
                <div className="w-full mb-6 px-10">
                    <Input
                        label="Search..."
                        type="text"
                        value={searchKeyword}
                        onChange={handleSearch}
                        className="p-2 border rounded-md mb-4"
                    />
                </div>
                <div className="grid grid-flow-row-dense md:grid-cols-2 lg:grid-cols-3 grid-cols-1 md:grid-rows-3 md:gap-2 gap-0">
                    {filteredArticles.map(article => (
                        <div key={article.id} className="p-4 border rounded-md max-w-sm">
                            <h2>{article.title}</h2>
                            <p>{article.summary}</p>
                            <p>{article.tags}</p>
                            <p>{article.published}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
