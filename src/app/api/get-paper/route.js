import Paper from "../../../../models/Paper";
import sequelize from "../../../lib/db";
import { Op } from "sequelize";  // Import Sequelize's operators

export async function GET(req, res) {
  const { searchParams } = new URL(req.url);
  const paperDate = searchParams.get('date');

  try {
    const papers = await Paper.findAll({
      where: sequelize.where(sequelize.fn('DATE', sequelize.col('paperDate')), paperDate)
    });

    if (papers.length < 1) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify(papers), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
